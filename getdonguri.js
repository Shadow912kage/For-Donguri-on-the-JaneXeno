// SETTING.TXTとスレの >>1 からどんぐり設定情報を取得、表示 ver.0.6.2
//
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
//	 JScript）Scripting.FileSystemObjectではUTF-8テキスト文字化けする。ADODB.Streamを使う。 - 晴歩雨描
//	 https://2ndart.hatenablog.com/entry/2022/08/07/155523
//	 www2.wbs.ne.jp/~kanegon/doc/code.txt
//	 http://www2.wbs.ne.jp/~kanegon/doc/code.txt
//
//  1st res top 
//   <>( sssp://img.5ch.net/ico/IMAGE.FILE(BE icon) <br>) !extend:(ID):(SLIP):(Max res. num.):(Max dat size KB):(donguri=x/y)(:) <br>
//  1st res bottom
//   <hr>VIPQ2_EXTDAT: ID:SLIP:Max res. num.:Max dat size KB:donguri=x/y: EXT was configured <>
//

// 修正履歴
//	ver.0.6.2: Cleaned up source code
//	ver.0.6.2pre.2
//					 : Added processing SETTING.TXT with ADODB.stream
//	ver.0.6.2pre.1
//           : Changed descriptions of SETTING.TXT,
//	         : 名前最大バイト数 -> 名前欄最大バイト数,  メール最大バイト数 -> メール欄最大バイト数, 最大行数 -> 本文最大行数
//           : Added version number display to the dialog window
//           : Added stream and file access with ADODB for JaneXeno's local setting.txt file
//           : Added BBS_TITLE, BBS_TITLE_ORIG and BBS_NONAME_NAME
//           : Added thread URL information
//           : WIP... processing SETTING.TXT from 5ch
//	ver.0.6.1: Added BBS_MAIL_COUNT
//	ver.0.6: Added general SETTING.TXT information, EXCEPT BBS_TITLE, BBS_TITLE_ORIG and BBS_NONAME_NAME
//         : Corrected parsing for BBS_USE_VIPQ2, regex (\d) -> (\d+)
//				 : WIP... stream and file access with ADODB
//	ver.0.5: Corrected regexp with BE icon (sssp://~)
//	ver.0.4: Added max res. number & max dat size informastions
//         : Correct regexp. of required donguri level
//	       : Added a process to handle commands with omitted parameters
//         : Correct regexps of donguri level & cannon availability with omitted parameters
//	ver.0.3.1: Corrected typo, "設定されいません" -> "設定されていません"
//	ver.0.3: Added thread donguri informations from local dat file
//         : Added a check on the number of arguments
//	ver.0.2.1: Corrected typo, "SETTINT.TXT" -> "SETTING.TXT"
//  ver.0.2: Added timeout process
//  ver.0.1: 1st release

var DispDonguriInfo = {
	// version number of getdonguri.js
	Version: "0.6.2",
	// Display donguri informations
	Disp: function() {
		// initalize
		this.Init();
		// display dialog window
		this.GetSettingTxt();
		this.ParseSettingTxt();
		this.GetDatDonguri();
		this.CreateDonguriTxt();
		this.Shell.Popup(this.DonguriTxt, 0, this.WinTitle);
	},
	// Initialize object
	Init: function() {
		this.WinTitle = "どんぐり情報 (" + WScript.ScriptName + " ver." + this.Version + ")",
		this.Shell = new ActiveXObject("WScript.Shell");
		this.useLocalSettingTxt = false; // Flag to use local setting.txt of JaneXeno or not
		this.ErrMsg = null;
		this.ParseUrl();
	},
	ParseUrl:	function() {
		var Urls = this.BoardUrl.match(/https:\/\/(([-A-Za-z0-9]+)\.5ch\.net)\/([-A-Za-z0-9]+)\//);
		if (Urls) {
			this.ServerFullName = Urls[1]
			this.ServerName = Urls[2];
			this.BoardName = Urls[3];
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
	// Get SETTING.TXT
	GetSettingTxt: function() {
		var lbpath = this.DatPath.match(/(.+\\)((\d+)\.dat)/);
		if (lbpath) {
			var lSettinTxtPath = lbpath[1] + "setting.txt"; // SETTING.TXT on the JaneXeno
			this.DatFileName = lbpath[2]; // .dat filename
			this.DatNumber = lbpath[3]; // .dat number (The integer part of UNIX time divided by 1000)
			this.ThreadTime = new Date(lbpath[3] * 1000); // The date and time the thread was created
		}
		if (this.useLocalSettingTxt) {
			var settingtxt = this.GetLocalSettingTxt(lSettinTxtPath);
			if (settingtxt)
				this.SettingTxt = settingtxt;
		} else
			this.SettingTxt = this.Get5chSettingTxt();
	},
	// Get a setting.txt file on the JaneXeno's local board folder.
	GetLocalSettingTxt: function(lSettinTxtPath) {
		var strm = new ActiveXObject("ADODB.Stream");
		strm.Type = 2; // text
		strm.charset = "shift_jis";
		strm.Open();
		strm.LoadFromFile(lSettinTxtPath);
		var settingTxt = strm.ReadText(-1); // read all
		strm.Close();
		return (settingTxt);
	},
	// Get a SETTING.TXT on the 5ch board resource. Ref. gethtmldat.js
	Get5chSettingTxt: function() {
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
			/*
			// The Content-Type header is ineffective for getting SETTING.TXT at least on the 5ch.
			this.UserAgent = "Monazilla/1.00 GetDonguri.Js/" + this.Version + " Windows/10.0.25330";
			this.ContentType = "text/plain; charset=shift_jis";
			this.ReqHeaders = {"User-Agent" : this.UserAgent, "content-type" : this.ContentType};
			for (i in this.ReqHeaders)
				http.setRequestHeader(i, this.ReqHeaders[i]);
			*/
			http.send();
		} catch (e) {
			this.ErrMsg = "SETTING.TXTを取得できませんでした\nエラーコード：" + e;
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
		// The response header(.headers) of SETTING.TXT is empty... So the WinHttp treat strings as Latin-1 for ResponseText.
		// NOooo... THERE IS a setting.txt file encoded with Shift_JIS in the JaneXeno's local board folder.
		//==========
		// The ResponseBody is in some mysterious state: Shift_JIS (the original encoding) encoded with UTF-16LE BOM encoding.
		// Probably because the HTTP communication is without a "content-type" header, the sending site sends it in Shift_JIS,
		// and the receiving local side processes it as is with UTF-16LE BOM.
		//==========
		// Ref. www2.wbs.ne.jp/~kanegon/doc/code.txt http://www2.wbs.ne.jp/~kanegon/doc/code.txt
		var scrFolder = WScript.ScriptFullName.substring(0,WScript.ScriptFullName.lastIndexOf("\\"));
		var settingTxtFile = scrFolder + "\\SETTING.TXT"; 
		var buf = http.ResponseBody;
		var stm = new ActiveXObject("ADODB.Stream");
		stm.Type = 1; // adTypeBinary
		stm.Open();
		stm.Write(buf);
		stm.Position = 2; // Skip BOM(FF FE), top of the ResponseBody(encoded with UTF-16)
		stm.SaveToFile(settingTxtFile, 2); // over write
		stm.Type = 2; // adTypeText
		stm.Charset = "shift_jis";
		stm.LoadFromFile(settingTxtFile);
		var retval = stm.ReadText();
		stm.Close();
		return(retval);
	},
	// Parse SETTING.TXT
	ParseSettingTxt: function() {
		// Donguri
		var acorn = this.SettingTxt.match(/BBS_ACORN=(\d)/);
		var vipq2 = this.SettingTxt.match(/BBS_USE_VIPQ2=(\d+)/);
		if (acorn)
			this.Acorn = acorn[1];
		if (vipq2)
			this.VipQ2 = vipq2[1];

		// Other board settings
		var title1 = this.SettingTxt.match(/BBS_TITLE=(.+)([@＠][25]ch掲示板)/);
		var title3 = this.SettingTxt.match(/BBS_TITLE=(.+)/);
		if (title1) {
			this.Title = title1[1];
			var title2 = title1[1].match(/(.+)((\(|（)仮(\)|）))/);
			if (title2)
				this.Title = title2[1];
		} else if (title3)
			this.Title = title3[1];
		var titleorig = this.SettingTxt.match(/BBS_TITLE_ORIG=(.+)/);
		if (titleorig)
			this.TitleOrig = titleorig[1];
		var noname = this.SettingTxt.match(/BBS_NONAME_NAME=(.+)/);
		if (noname)
			this.NoName = noname[1];
		var maxrows = this.SettingTxt.match(/BBS_LINE_NUMBER=(\d+)/);
		if (maxrows)
			this.MaxRows = parseInt(maxrows[1]) * 2;
		var namelen = this.SettingTxt.match(/BBS_NAME_COUNT=(\d+)/);
		if (namelen)
			this.NameLen = namelen[1];
		var maillen = this.SettingTxt.match(/BBS_MAIL_COUNT=(\d+)/);
		if (maillen)
			this.MailLen = maillen[1];
		var ressize = this.SettingTxt.match(/BBS_MESSAGE_COUNT=(\d+)/);
		if (ressize)
			this.ResSize = ressize[1];
		var slip = this.SettingTxt.match(/BBS_SLIP=(.+)/);
		if (slip)
			this.SLIP = slip[1];
		var dispip = this.SettingTxt.match(/BBS_DISP_IP=(.+)/);
		if (dispip)
			this.DispIP = dispip[1];
		var forceid = this.SettingTxt.match(/BBS_FORCE_ID=(.+)/);
		if (forceid)
			this.ForceID = forceid[1];
		var beid = this.SettingTxt.match(/BBS_BE_ID=(\d)/);
		if (beid)
			this.BEID = beid[1];
		var noid = this.SettingTxt.match(/BBS_NO_ID=(.+)/);
		if (noid)
			this.NoID = noid[1];
	},
	// Get 1st res. of local dat and parse it
	GetDatDonguri: function() {
		var fs = new ActiveXObject("Scripting.FileSystemObject");
		var dat = fs.OpenTextFile(this.DatPath, 1, 0);
		var dat1st = dat.ReadLine();
		dat.Close();
		var dngrtop = dat1st.match(/<>( sssp:\/\/img\.5ch\.net\/ico\/[-\w!#\$%&'\(\)\*\+,\.:;=?]+? <br>)? !extend:(.*?):(.*?):(\d+)?:(\d+)?(:donguri=(\d+)\/(\d))?:{0,2} <br>/);
		var dngrbtm = dat1st.match(/<hr>VIPQ2_EXTDAT: (.+?):(.+?):(\d+):(\d+):(donguri=(\d+)\/(\d))?: EXT was configured <>/);
		if (dngrtop) {
			this.Id = dngrtop[2];
			this.Slip = dngrtop[3];
			this.Resmax = dngrtop[4] || "1000";
			this.Datmax = dngrtop[5] || "512";
			if (dngrtop[6]) {
				this.Dlevel = dngrtop[7];
				this.Cannon = dngrtop[8];
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
		// URL information
		var dontxt = "●URL情報\n";
		dontxt += " 掲示板URL：" + this.BoardUrl + "\n";
		dontxt += " サーバー名：" + this.ServerFullName + "\n";
		dontxt += " 掲示板名：" + this.BoardName + "\n";
		dontxt += " dat番号：" + this.DatNumber + "\n";
		var jpnDay = ["日", "月", "火", "水", "木", "金", "土"];
		var ThrdFormTime = this.ThreadTime.getFullYear() + "/" + zeroPad(Number(this.ThreadTime.getMonth() + 1)) + "/" + zeroPad(this.ThreadTime.getDate()) + "(" + jpnDay[this.ThreadTime.getDay()] + ") " + zeroPad(this.ThreadTime.getHours()) + ":" + zeroPad(this.ThreadTime.getMinutes()) + ":" + zeroPad(this.ThreadTime.getSeconds());
		dontxt += " スレッド作成日時：" + ThrdFormTime + "\n";
		dontxt += "\n5ch ではスレッド作成日時の UNIX time を 1000 で割った整数部分を dat番号としており、これが被った場合は +1 しています。このため dat番号から作成日時を逆算すると、ミリ秒部分は不明となり実際の秒数とは異なる場合があります。\n";
		dontxt += "\n";
		function zeroPad(num) {
			if (Number(num) < 10)
				return ("0" + String(num));
			return (num);
		};

		// SETTING.TXT
		/// Other settings
		dontxt += "●掲示板設定 (SETTING.TXT)\n";
		if (this.TitleOrig)
			dontxt += " 板名：" + this.TitleOrig;
		else if (this.Title)
			dontxt += " 板名：" + this.Title;
		dontxt += "\n";
		if (this.NoName)
			dontxt += " デフォルト名無し："  + this.NoName + "\n";
		if (this.NameLen)
			dontxt += " 名前欄最大バイト数：" + this.NameLen + " KB\n";
		if (this.MailLen)
			dontxt += " メール欄最大バイト数：" + this.MailLen + " KB\n";
		if (this.MaxRows)
			dontxt += " 本文最大行数：" + this.MaxRows + " 行\n";
		if (this.ResSize)
			dontxt += " 本文最大バイト数：" + this.ResSize + " KB\n";
		if (this.DispIP)
			dontxt += " 強制 IP addr.表示：" + this.DispIP + "\n";
		if (this.ForceID)
			dontxt += " 強制 ID 表示：" + this.ForceID + "\n";
		if (this.SLIP)
			dontxt += " SLIP：" + this.SLIP + "\n";
		if (this.BEID)
			dontxt += " BEログイン：" + this.BEID + "\n";
		if (this.NoID)
			dontxt += " ID非表示：" + this.NoID + "\n";

		/// Donguri
		var acorntxt = [" (どんぐりは設定されていません?)", " どんぐりレベル強制表示", " どんぐりレベル非表示 (任意表示)"];
		var vipq2txt = [" (デフォルト設定？)", " !chkBBx: が使用可\n", " !extend: 等が使用可\n", " VI1PQ2 コマンド使用時に、段位を表示\n",
		" !chkBBx: 使用時にスマホ系はホスト名を一部変換\n", " (未実装？使用不可？)\n"];
		dontxt += "\n●どんぐり関連設定 (SETTING.TXT)\n";
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