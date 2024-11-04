// SETTING.TXT からどんぐり設定情報を取得、表示 ver.0.2.1
//  Usage: getdonguri.js 5chの板のURL
//
//	JaneXeno の ツール(O) > 設定(O)... > 機能 > コマンド で以下のように設定
//	 コマンド名： どんぐり情報表示
//		(任意の文字列)
//	 実行するコマンド： wscript "$BASEPATHScript/getdonguri.js" $BURL
//		(2つ目のパラーメータは、JaneXeno をインストールしたフォルダ下の Script というフォルダに getdonguri.js というファイル名で置いた場合)
//
//  参考文献
//   コマンド - 5chどんぐり非公式まとめwiki
//   https://donguri.wikiru.jp/index.php?command
//   新生VIPQ2 - ５ちゃんねるwiki
//   https://info.5ch.net/?curid=2759
//
// 修正履歴
//	ver.0.2.1: Corrected typo, "SETTINT.TXT" -> "SETTING.TXT"
//  ver.0.2: Added timeout process
//  ver.0.1: 1st release

var DispDonguriInfo = {
	// Initialize object
	Init: function() {
		this.Shell = new ActiveXObject("WScript.Shell");
		this.ErrMsg = null;
		// get SETTING.TXT URL
		this.ParseUrl();
	},
	ParseUrl:	function() {
		var Urls = this.BoardUrl.match(/https:\/\/([-A-Za-z0-9]+)\.5ch\.net\/([-A-Za-z0-9]+)\//);
		if (Urls) {
			this.ServerName = Urls[1];
			this.BoardName = Urls[2];
			this.SettingTxtUrl = this.BoardUrl.concat("SETTING.TXT");
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
	// Display donguri informations
	Disp: function() {
		// initalize
		this.Init();
		// get SETTING.TXT, ref. gethtmldat.js
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
		// display dialog window
		this.SettingTxt = http.ResponseText;
		this.ParseSettingTxt();
		this.CreateDonguriTxt();
		//this.Shell.Popup(this.SettingTxt, 0, "SETTING.TXT");
		this.Shell.Popup(this.DonguriTxt, 0, "どんぐり情報 from SETTING.TXT");
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
	// Create described text of the Donguri
	CreateDonguriTxt: function() {
		var acorntxt = [" (どんぐりは設定されていません?)", " どんぐりレベル強制表示", " どんぐりレベル非表示(任意表示)"];
		var vipq2txt = [" (デフォルト設定？)", " !chkBBx: が使用可\n", " !extend: 等が使用可\n", " VIPQQ2 コマンド使用時に、段位を表示\n",
		" !chkBBx: 使用時にスマホ系はホスト名を一部変換\n", " (未実装？使用不可？)\n"];
		var dontxt = "";
		if (this.Acorn) {
			dontxt = "BBS_ACORN=".concat(this.Acorn.toString()).concat("\n");
			dontxt = dontxt.concat(acorntxt[this.Acorn]).concat("\n\n");
		} else {
			dontxt = dontxt.concat("BBS_ACORN (どんぐり) は設定されいません\n\n");
		}
		if (this.VipQ2) {
			var vipq2key = 0;
			var vipq2tmp = "BBS_USE_VIPQ2=".concat(this.VipQ2).concat("\n");
			if (this.VipQ2 > 0) vipq2key = 1;
			if (this.VipQ2 > 1) vipq2key = 2;
			if (this.VipQ2 > 3) vipq2key = 3;
			if (this.VipQ2 > 7) vipq2key = 4;
			if (this.VipQ2 > 255) vipq2key = 5;
			if (vipq2key == 0)
				vipq2tmp = vipq2txt[vipq2key];
			for (var i = 0; i < vipq2key; i++)
				vipq2tmp = vipq2tmp.concat(vipq2txt[i+1]);
			dontxt = dontxt.concat(vipq2tmp);
		} else {
			dontxt = dontxt.concat("BBS_USE_VIPQ2(VIPQ2コマンド) は設定されていません\n");
		}
		this.DonguriTxt = dontxt;
	}
}

var args = WScript.Arguments;
DispDonguriInfo.BoardUrl = args(0);
DispDonguriInfo.Disp();