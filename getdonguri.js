// SETTING.TXTとスレの >>1 からどんぐり設定情報を取得、表示 ver.0.4
//  Usage: getdonguri.js 5chの板のURL ローカル保存されているDATのパス
//
//	JaneXeno の ツール(O) > 設定(O)... > 機能 > コマンド で以下のように設定
//	 コマンド名： どんぐり情報表示
//		(任意の文字列)
//	 実行するコマンド： wscript "$BASEPATHScript/getdonguri.js" "$BURL" "$LOCALDAT"
//		(2つ目のパラーメータは、JaneXeno をインストールしたフォルダ下の Script というフォルダに getdonguri.js というファイル名で置いた場合)
//
//  参考文献
//
//	 SETTING.TXT - ５ちゃんねるwiki
//	 https://info.5ch.net/index.php/SETTING.TXT
//	 BBS_SLIP - ５ちゃんねるwiki
//	 https://info.5ch.net/index.php/BBS_SLIP
//	 新生VIPQ2 - ５ちゃんねるwiki
//	 https://info.5ch.net/index.php/%E6%96%B0%E7%94%9FVIPQ2#!extend:
//
//   コマンド - 5chどんぐり非公式まとめwiki
//   https://donguri.wikiru.jp/?command
//
//  1st res top 
//   <> !extend:(ID):(SLIP):1000:512:donguri=(x/y) <br>
//  1st res bottom
//   <hr>VIPQ2_EXTDAT: (ID):(SLIP):1000:512:donguri=(x/y): EXT was configured <>
//
// 修正履歴
//	ver.0.4: Added max res. number & max dat size informastions
//         : Correct regexp. of required donguri level
//	       : Added a process to handle commands with omitted parameters
//         : Correct regex. of donguri level & cannon availability with omitted parameters
//	ver.0.3.1: Corrected typo, "設定されいません" -> "設定されていません"
//	ver.0.3: Added thread donguri informations from local dat file
//         : Added a check on the number of arguments
//	ver.0.2.1: Corrected typo, "SETTINT.TXT" -> "SETTING.TXT"
//  ver.0.2: Added timeout process
//  ver.0.1: 1st release

var DispDonguriInfo = {
	// Display donguri informations
	Disp: function() {
		// initalize
		this.Init();
		// display dialog window
		this.GetSettingTxt();
		this.ParseSettingTxt();
		this.GetDatDonguri();
		this.CreateDonguriTxt();
		this.Shell.Popup(this.DonguriTxt, 0, "どんぐり情報");
	},
	// Initialize object
	Init: function() {
		this.Shell = new ActiveXObject("WScript.Shell");
		this.ErrMsg = null;
		this.ParseUrl();
	},
	ParseUrl:	function() {
		var Urls = this.BoardUrl.match(/https:\/\/([-A-Za-z0-9]+)\.5ch\.net\/([-A-Za-z0-9]+)\//);
		if (Urls) {
			this.ServerName = Urls[1];
			this.BoardName = Urls[2];
			this.SettingTxtUrl = this.BoardUrl + "SETTING.TXT";
		} else {
			this.ErrMsg = "5ちゃんねるの掲示板ではありません";
			this.DispErr();
		};
	},
	// Display error message & quit process
	DispErr: function() {
		this.Shell.Popup(this.ErrMsg, 0, "エラー");
		WScript.Quit();
	},
	// Get SETTING.TXT, ref. gethtmldat.js
	GetSettingTxt: function() {
		var USED_WINHTTP = true;
		try {http = new ActiveXObject("WinHttp.WinHttpRequest.5.1");} catch (e) {}
		if (!http) try {http = new ActiveXObject("Msxml2.ServerXMLHTTP.6.0");} catch (e) {}
		if (!http) try {http = new ActiveXObject("Msxml2.ServerXMLHTTP.3.0");} catch (e) {}
		if (!http) var USED_WINHTTP = false;
		if (!http) try {http = new ActiveXObject("Msxml2.XMLHTTP.6.0");} catch (e) {}
		if (!http) {http  = new ActiveXObject("Msxml2.XMLHTTP.3.0");}

		var TIME_OUT = 3000; // 3000 msec
		if (USED_WINHTTP) {
			http.SetTimeouts(TIME_OUT, TIME_OUT, TIME_OUT, TIME_OUT);
		} else {
			http.timeout = TIME_OUT;
			http.ontimeout = function() {
				this.ErrMsg = "サーバーからの応答がありません";
				this.DispErr();
			};
		}
		try {
			http.open("GET", this.SettingTxtUrl, true);
			http.send();
		} catch (e) {
			this.ErrMsg = "SETTING.TXTを取得できませんでした"
			this.DispErr();
		}
		if (USED_WINHTTP) {
			if (!http.WaitForResponse()) {
				this.ErrMsg = "サーバーからの応答がありません";
				this.DispErr();
			}
		} else {
			while (http.ReadyState < 4) {}
		}
		this.SettingTxt = http.ResponseText;
	},
	// Parse SETTING.TXT
	ParseSettingTxt: function() {
		var acorn = this.SettingTxt.match(/BBS_ACORN=(\d)/);
		var vipq2 = this.SettingTxt.match(/BBS_USE_VIPQ2=(\d)/);
		if (acorn)
			this.Acorn = acorn[1];
		else
			this.Acorn = null;
		if (vipq2)
			this.VipQ2 = vipq2[1];
		else
			this.VipQ2 = null;
	},
	// Get 1st res. of local dat and parse it
	GetDatDonguri: function() {
		var fs = new ActiveXObject("Scripting.FileSystemObject");
		var dat = fs.OpenTextFile(this.DatPath, 1, 0);
		var dat1st = dat.ReadLine();
		dat.Close();
		var dngrtop = dat1st.match(/<> !extend:(.*?):(.*?):(\d+)?:(\d+)?(:donguri=(\d+)\/(\d))?:{0,2} <br>/);
		var dngrbtm = dat1st.match(/<hr>VIPQ2_EXTDAT: (.+?):(.+?):(\d+):(\d+):(donguri=(\d+)\/(\d))?: EXT was configured <>/);
		if (dngrtop) {
			this.Id = dngrtop[1];
			this.Slip = dngrtop[2];
			this.Resmax = dngrtop[3] || "1000";
			this.Datmax = dngrtop[4] || "512";
			if (dngrtop[5]) {
				this.Dlevel = dngrtop[6];
				this.Cannon = dngrtop[7];
			}
		}
		if (dngrbtm) {
			this.Id = dngrbtm[1];
			this.Slip = dngrbtm[2];
			this.Resmax = dngrbtm[3];
			this.Datmax = dngrbtm[4];
			if (dngrbtm[5]) {
				this.Dlevel = dngrbtm[6];
				this.Cannon = dngrbtm[7];
			}
		}
	},
	// Create described text of the Donguri
	CreateDonguriTxt: function() {
		// SETTING.TXT
		var acorntxt = [" (どんぐりは設定されていません?)", " どんぐりレベル強制表示", " どんぐりレベル非表示 (任意表示)"];
		var vipq2txt = [" (デフォルト設定？)", " !chkBBx: が使用可\n", " !extend: 等が使用可\n", " VIPQQ2 コマンド使用時に、段位を表示\n",
		" !chkBBx: 使用時にスマホ系はホスト名を一部変換\n", " (未実装？使用不可？)\n"];
		var dontxt = "●掲示板設定 (SETTING.TXT)\n";
		if (this.Acorn) {
			dontxt += " BBS_ACORN=" + this.Acorn.toString() + "\n";
			dontxt += acorntxt[this.Acorn] + "\n\n";
		} else {
			dontxt += " BBS_ACORN (どんぐり) は設定されていません\n\n";
		}
		if (this.VipQ2) {
			var vipq2key = 0;
			var vipq2tmp = " BBS_USE_VIPQ2=" + this.VipQ2 + "\n";
			if (this.VipQ2 > 0) vipq2key = 1;
			if (this.VipQ2 > 1) vipq2key = 2;
			if (this.VipQ2 > 3) vipq2key = 3;
			if (this.VipQ2 > 7) vipq2key = 4;
			if (this.VipQ2 > 255) vipq2key = 5;
			if (vipq2key == 0)
				vipq2tmp = vipq2txt[vipq2key];
			for (var i = 0; i < vipq2key; i++)
				vipq2tmp = vipq2tmp + vipq2txt[i+1];
			dontxt += vipq2tmp;
		} else {
			dontxt += " BBS_USE_VIPQ2 (VIPQ2コマンド) は設定されていません\n";
		}
		// !extend: command in 1st res. of local dat file
		dontxt += "\n●スレッド情報 (!extend: コマンド)\n";
		if (this.Id || this.Slip || this.Dlevel || this.Cannon) {
			switch (this.Id) {
				case "none":
					dontxt += " IDなし\n";
					break;
				case "checked":
					dontxt += " 強制ID\n";
					break;
				case "default":
				case "on":
				default:
					dontxt += " 板のデフォルトID表示\n";
			}
			switch (this.Slip) {
				case "none":
					dontxt += " SLIPなし (ID末尾なし)\n";
					break;
				case "checked":
					dontxt += " SLIPなし (簡易ID末尾)\n";
					break;
				case "feature":
					dontxt += " SLIPなし (基本ID末尾)\n";
					break;
				case "verbose":
					dontxt += " SLIPなし (詳細ID末尾)\n";
					break;
				case "vvv":
					dontxt += " 回線種別のみ (詳細ID末尾)\n";
					break;
				case "vvvv":
					dontxt += " 回線種別+IP addr. (詳細ID末尾)\n";
					break;
				case "vvvvv":
					dontxt += " 回線種別+SLIP (詳細ID末尾)\n";
					break;
				case "vvvvvv":
					dontxt += " 回線種別+SLIP+IP addr. (詳細ID末尾)\n";
					break;
				case "default":
				case "on":
				default:
					dontxt += " 板のデフォルトSLIP (ID末尾なし)\n";
			}
			dontxt += " レス上限：" + this.Resmax + "\n 最大datサイズ：" + this.Datmax + " KB\n";
			if (this.Dlevel)
				dontxt += " 必要どんぐりレベル：" + this.Dlevel + "\n";
			else
				dontxt += " 必要どんぐりレベルは板のデフォルト\n"
			switch (this.Cannon) {
				case "1":
					dontxt += " 強制レベル表示/大砲可\n";
					break;
				case "2":
					dontxt += " 任意レベル表示/大砲可\n";
					break;
				case "3":
					dontxt += " 強制レベル表示/大砲不可\n";
					break;
				case "4":
					dontxt += " 任意レベル表示/大砲不可\n";
					break;
				default:
					dontxt += " レベル表示/大砲は板のデフォルト\n";
			}
		} else {
			dontxt += " !extend: コマンドは使用されていません";
		}
		this.DonguriTxt = dontxt;
	}
}

var args = WScript.Arguments;
if (args.length < 2) { // Arguments check
	var thisname = WScript.ScriptName;
	var message = "引数の数が足りません！\n\n使用法：\n " + thisname + " 5chの板のURL DATファイル名\n\nJaneXeno のコマンド設定例：\n" + " wscript \"$BASEPATHScript/" + thisname + "\" \"$BURL\" \"$LOCALDAT\"";
	WScript.Echo(message);
	WScript.Quit();
}
DispDonguriInfo.BoardUrl = args(0);
DispDonguriInfo.DatPath = args(1);
DispDonguriInfo.Disp();