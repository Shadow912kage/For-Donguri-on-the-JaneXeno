// SETTING.TXTとスレの >>1 からどんぐり設定情報を取得、表示 ver.0.6.3
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
//	ver.0.6.3: Added a User-Agent header to the HTTP request header
//           : Added an ETag value to the HTTP request "If-Not-Modified" header and check returned HTTP status
//           : Added caching an ETag value and the SETTING.TXT to EtagSettingTxt.Cache\<server name>.<board name>.txt file
//	ver.0.6.3pre.2: Be more simple and readable code
//	ver.0.6.3pre.1: Be more simple for the function ParseSettingTxt() using a hashtable
//	ver.0.6.2.1: Corrected unit of BBS_NAME_COUNT, BBS_MAIL_COUNT and BBS_MESSAGE_COUNT on the window (KB -> Bytes)
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
	Version: "0.6.3",
	// Flag to use local setting.txt of JaneXeno or not (false or true)
	useLocalSettingTxt: false,
//	useLocalSettingTxt: true,

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
		this.WinTitle = "どんぐり情報 (" + WScript.ScriptName + " ver." + this.Version + ")";
		this.GetWindowsVersion();
		this.UserAgent = "Monazilla/1.00 GetDonguri.Js/" + this.Version + " Windows/" + this.WinVersion;
		this.Shell = new ActiveXObject("WScript.Shell");
		this.ErrMsg = null;
		this.ParseUrl();
		this.CreateCacheFolder();
	},
	// ref. windows - Find OS Name/Version using JScript - Stack Overflow
	//      https://stackoverflow.com/questions/351282/find-os-name-version-using-jscript
	GetWindowsVersion: function() {
		var objWMISrvc = GetObject("winmgmts:\\\\.\\root\\CIMV2");
		var enumItems = new Enumerator(objWMISrvc.ExecQuery("Select * From Win32_OperatingSystem"));
		var sys = enumItems.item();
		this.WinVersion = sys.Version;
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
		}
	},
	CreateCacheFolder: function () {
		var scrFolder = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf("\\"));
		var cacheFolder = scrFolder + "\\EtagSettingTxt.Cache";
		var fs = new ActiveXObject("Scripting.FileSystemObject");
		if (!fs.FolderExists(cacheFolder))
			fs.CreateFolder(cacheFolder);
		this.EtagSettingTxtFile = cacheFolder + "\\" + this.ServerName + "." + this.BoardName + ".txt";
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
			var thrdTime = new Date(lbpath[3] * 1000); // The date and time the thread was created
			this.ThreadTime = formJpnTime(thrdTime); // Japanese style date and time.
		}
		if (this.useLocalSettingTxt) {
			this.GetLocalSettingTxt(lSettinTxtPath);
		} else {
			this.GetEtagSettingTxtCache();
			this.Get5chSettingTxt();
		}

		// Formmat Japanese style date and time - YYYY/MM/DD(DoW) HH:MM:SS
		function formJpnTime(time) {
			var jpnDay = ["日", "月", "火", "水", "木", "金", "土"];
			var frmT = time.getFullYear() + "/" + zeroPad(Number(time.getMonth() + 1)) + "/" + zeroPad(time.getDate()) + "(" + jpnDay[time.getDay()] + ") " + zeroPad(time.getHours()) + ":" + zeroPad(time.getMinutes()) + ":" + zeroPad(time.getSeconds());
			return (frmT);
		}
		// Fill in the leading zero of single-digit numbers to make them two digits.
		function zeroPad(num) {
			if (Number(num) < 10)
				return ("0" + String(num));
			return (num);
		}
	},
	// Get a setting.txt file on the JaneXeno's local board folder.
	GetLocalSettingTxt: function(lSettinTxtPath) {
		var strm = new ActiveXObject("ADODB.Stream");
		strm.Type = 2; // text
		strm.charset = "shift_jis";
		strm.Open();
		strm.LoadFromFile(lSettinTxtPath);
		this.SettingTxt = strm.ReadText();
		strm.Close();
	},
	// Get Etag and SETTING.TXT Cache
	GetEtagSettingTxtCache: function(){
		var fs = WScript.CreateObject("Scripting.FileSystemObject");
		if (fs.FileExists(this.EtagSettingTxtFile)) {
			var strm = new ActiveXObject("ADODB.Stream");
			strm.Type = 2; // text
			strm.charset = "shift_jis";
			strm.Open();
			strm.LoadFromFile(this.EtagSettingTxtFile);
			this.SettingTxt = strm.ReadText();
			strm.Close();
			var etag = this.SettingTxt.match(/^ETag: (".+")\n/);
			if (etag)
				this.ETag = etag[1];
		}
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
			}
		}
		try {
			http.open("GET", this.SettingTxtUrl, true);
			http.setRequestHeader("User-Agent", this.UserAgent);
			if (this.ETag)
				http.setRequestHeader("If-None-Match", this.ETag);
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
		if (http.Status == "304") // SETTING.TXT is NOT modified
			return;

		if (this.ETag) 
			this.WinTitle += " - The SETTING.TXT had been modified!";
		else
			this.WinTitle += " - New board";

		this.ETag = http.GetResponseHeader("ETag");

		// The WinHttp treat strings as Latin-1 for ResponseText in the Content-Type header w/o charset parameter
		// NOooo... THERE IS a setting.txt file encoded with Shift_JIS in the JaneXeno's local board folder.
		//==========
		// The ResponseBody is in some mysterious state: Shift_JIS (the original encoding) encoded with UTF-16LE BOM encoding.
		// Probably because the HTTP communication is without a "content-type" header, the sending site sends it in Shift_JIS,
		// and the receiving local side processes it as is with UTF-16LE BOM.
		//==========
		// Ref. www2.wbs.ne.jp/~kanegon/doc/code.txt http://www2.wbs.ne.jp/~kanegon/doc/code.txt
		var strm = new ActiveXObject("ADODB.Stream");
		strm.Type = 1; // adTypeBinary
		strm.Open();
		strm.Write(http.ResponseBody);
		strm.Position = 2; // Skip BOM(FF FE), top of the ResponseBody(encoded with UTF-16)
		strm.SaveToFile(this.EtagSettingTxtFile, 2); // over write, raw SETTING.TXT
		strm.Type = 2; // adTypeText
		strm.Charset = "shift_jis";
		strm.LoadFromFile(this.EtagSettingTxtFile);
		this.SettingTxt = "ETag: " + this.ETag + "\n" + strm.ReadText(); // Add an ETag value to the top of SETTING.TXT
		strm.Position = 0; // Reset writing position
		strm.WriteText(this.SettingTxt);
		strm.SaveToFile(this.EtagSettingTxtFile, 2); // over write, ETag value and SETTING.TXT
		strm.Close();
	},
	// Parse SETTING.TXT
	ParseSettingTxt: function() {
		// The hashtable between DispDonguriInfo's property and its regex pattern for searching SETTING.TXT 
		var propNameRegExTbl = {
			// Donguri
			'Acorn' : /BBS_ACORN=(\d)/,
			'VipQ2' : /BBS_USE_VIPQ2=(\d+)/,
			// Other board settings
			'title1' : /BBS_TITLE=(.+)([@＠][25]ch掲示板)/,
			'title3' : /BBS_TITLE=(.+)/,
			'TitleOrig' : /BBS_TITLE_ORIG=(.+)/,
			'NoName' : /BBS_NONAME_NAME=(.+)/,
			'MaxRows' : /BBS_LINE_NUMBER=(\d+)/,
			'NameLen' : /BBS_NAME_COUNT=(\d+)/,
			'MailLen' : /BBS_MAIL_COUNT=(\d+)/,
			'ResSize' : /BBS_MESSAGE_COUNT=(\d+)/,
			'SLIP' : /BBS_SLIP=(.+)/,
			'DispIP' : /BBS_DISP_IP=(.+)/,
			'ForceID' : /BBS_FORCE_ID=(.+)/,
			'BEID' : /BBS_BE_ID=(\d)/,
			'NoID' : /BBS_NO_ID=(.+)/
		}
		for (propName in propNameRegExTbl) {
			var item = this.SettingTxt.match(propNameRegExTbl[propName]);
			if (item) {
				switch (propName) {
				case 'title1':
					this.Title = item[1];
					var title2 = item[1].match(/(.+)((\(|（)仮(\)|）))/);
					if (title2)
						this.Title = title2[1];
					break;
				case 'title3':
					if (!this.Title)
						this.Title = item[1];
					break;
				default:
					this[propName] = item[1];
				}
			}
		}
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
		} else if (dngrbtm) {
			this.Id = dngrbtm[1];
			this.Slip = dngrbtm[2];
			this.Resmax = dngrbtm[3];
			this.Datmax = dngrbtm[4];
			if (dngrbtm[5]) {
				this.Dlevel = dngrbtm[6];
				this.Cannon = dngrbtm[7];
			}
		} else {
			this.NoExtend = true;
		}
	},
	// Create described text of the Donguri
	CreateDonguriTxt: function() {
		// General information table & object
		var urlItems = [
		{propName: 'BoardUrl', ItemName: "掲示板URL", Unit: null},
		{propName: 'ServerFullName', ItemName: "サーバー名", Unit: null},
		{propName: 'BoardName', ItemName: "掲示板名", Unit: null},
		{propName: 'DatNumber', ItemName: "dat番号", Unit: null},
		{propName: 'ThreadTime', ItemName: "スレッド作成日時", Unit: null}];
		var settingtxtItems = [
		{propName: 'TitleOrig', ItemName: "板名", Unit: null},
		{propName: 'Title', ItemName: "板名", Unit: null},
		{propName: 'NoName', ItemName: "デフォルト名無し", Unit: null},
		{propName: 'NameLen', ItemName: "名前欄最大バイト数", Unit: "Bytes"},
		{propName: 'MailLen', ItemName: "メール欄最大バイト数", Unit: "Bytes"},
		{propName: 'MaxRows', ItemName: "本文最大行数", Unit: "行"},
		{propName: 'ResSize', ItemName: "本文最大バイト数", Unit: "Bytes"},
		{propName: 'DispIP', ItemName: "強制 IP addr.表示", Unit: null},
		{propName: 'ForceID', ItemName: "強制 ID 表示", Unit: null},
		{propName: 'SLIP', ItemName: "SLIP", Unit: null},
		{propName: 'BEID', ItemName: "BEログイン", Unit: null},
		{propName: 'NoID', ItemName: "ID非表示", Unit: null}];
		var GeneralInfoTbl = [
		{Heading: "URL情報", objItems: urlItems,
		 Notes: "5ch ではスレッド作成日時の UNIX time を 1000 で割った整数部分を dat番号としており、これが被った場合は +1 しています。このため dat番号から作成日時を逆算すると、ミリ秒部分は不明となり実際の秒数とは異なる場合があります。"},
		{Heading: "掲示板設定 (SETTING.TXT)", objItems: settingtxtItems,
		 Notes: "SETTING.TXT に設定項目はありませんが、スレッドのレス上限は 1000、最大datサイズは 512 KB がそれぞれの既定値です。"}];

		// Donguri information table & object
		var acornDescTbl = ["(どんぐり) は設定されていません", "どんぐりレベル強制表示", "どんぐりレベル非表示 (任意表示)"];
		var vipq2DescTbl = ["(VIPQ2コマンド) は設定されていません", "!chkBBx: が使用可", "!extend: 等が使用可", "VI1PQ2 コマンド使用時に、段位を表示", "!chkBBx: 使用時にスマホ系はホスト名を一部変換", "(未実装？使用不可？)"];
		var donguriItems = [
		{propName: 'Acorn', ItemName: "BBS_ACORN", ItemDescTbl: acornDescTbl},
		{propName: 'VipQ2', ItemName: "BBS_USE_VIPQ2", ItemDescTbl: vipq2DescTbl}];
		var DonguriInfoTbl = [
		{Heading: "どんぐり関連設定 (SETTING.TXT)", objItems: donguriItems, Notes: null}];

		// Thread information table & object
		var idDescTbl = {
			"none": "IDなし", "checked": "強制ID", "default": "板のデフォルトID表示", "on": "板のデフォルトID表示", "": "板のデフォルトID表示"
		};
		var slipDescTbl = {
			"none": "SLIPなし (ID末尾なし)", "checked": "SLIPなし (簡易ID末尾)", "feature": "SLIPなし (基本ID末尾)", "verbose": "SLIPなし (詳細ID末尾)", "vvv": "回線種別のみ (詳細ID末尾)", "vvvv": "回線種別+IP addr. (詳細ID末尾)", "vvvvv": "回線種別+SLIP (詳細ID末尾)", "vvvvvv": "回線種別+SLIP+IP addr. (詳細ID末尾)", "default": "板のデフォルトSLIP (ID末尾なし)", "on": "板のデフォルトSLIP (ID末尾なし)", "": "板のデフォルトSLIP (ID末尾なし)"
		};
		var cannonDescTbl = ["レベル表示/大砲は板のデフォルト", "強制レベル表示/大砲可", "任意レベル表示/大砲可", "強制レベル表示/大砲不可", "任意レベル表示/大砲不可"];
		var threadItems = [
		"!extend: コマンドは使用されていません",
		{propName: 'Id', ItemValues: idDescTbl},
		{propName: 'Slip', ItemValues: slipDescTbl},
		{propName: 'Resmax', ItemName: "レス上限", Unit: null},
		{propName: 'Datmax', ItemName: "最大datサイズ", Unit: "KB"},
		{propName: 'Dlevel', ItemName: "必要どんぐりレベル", Default: "は板のデフォルト"},
		{propName: 'Cannon', ItemValues: cannonDescTbl}];
		var ThreadInfoTbl = [
		{Heading: "スレッド情報 (!extend: コマンド)", objItems: threadItems, Notes: null}];

		var dngrContents = {
			// ref. Javascriptで関数内から親関数のプロパティにアクセスしたくて困った話。 - 旧山ｐの楽しいお勉強生活
			//      https://yamap-55.hatenadiary.org/entry/20140201/1391235026
			_parent: this, // store 'this' to _parent property for accessing the parent object from the child object

			gInfoTxt: "", // General information text from SETTING.TXT
			dInfoTxt: "", // Donguri information text from SETTING.TXT
			tInfoTxt: "", // Thread information text from !extend command or VIPQ2_EXTDAT of the 1st. message in the thread
			getDngrTxt: function () { return(this.gInfoTxt + this.dInfoTxt + this.tInfoTxt);},

			// Add General information section from SETTING.TXT
			addGnrlSect: function(gInfoTbl) {
				for (var i = 0; i < gInfoTbl.length; i++) {
					// add heading
					this.gInfoTxt += "●" + gInfoTbl[i].Heading + "\n";
					// add items
					var items = gInfoTbl[i].objItems;
					var _titleOrig = false;
					for (var j = 0; j < items.length; j++) {
						var _propName = items[j].propName;
						var _property = this._parent[_propName];
						if (_property) {
							switch (_propName) {
							case 'Title':
								if (_titleOrig)
									break;
							case 'TitleOrig':
								_titleOrig = true;
							default:
								this.gInfoTxt += " " + items[j].ItemName + "：" + _property;
								if (items[j].Unit)
									 this.gInfoTxt += " " + items[j].Unit;
								this.gInfoTxt += "\n";
							}
						}
					}
					// add notes
					if (gInfoTbl[i].Notes)
						this.gInfoTxt += "\n" + gInfoTbl[i].Notes + "\n";
					this.gInfoTxt += "\n";
				}
			},

			// Add Donguri information section from SETTING.TXT
			addDngrSect: function (dInfoTbl) {
				for (var i = 0; i < dInfoTbl.length; i++) {
					// add heading
					this.dInfoTxt += "●" + dInfoTbl[i].Heading + "\n";
					// add items
					var items = dInfoTbl[i].objItems;
					for (var j = 0; j < items.length; j++) {
						var _propName = items[j].propName;
						var _property = this._parent[_propName];
						this.dInfoTxt += " " + items[j].ItemName;
						switch (_propName) {
						case 'Acorn':
							if (_property) {
								this.dInfoTxt += "=" + _property + "\n";
								this.dInfoTxt += " " + items[j].ItemDescTbl[_property];
							} else {
								this.dInfoTxt += " " + items[j].ItemDescTbl[0];
							}
							this.dInfoTxt += "\n\n";
							break;
						case 'VipQ2':
							if (_property) {
								var vipq2key = 0;
								this.dInfoTxt += "=" + _property + "\n";
								if (_property > 0) vipq2key = 1;
								if (_property > 1) vipq2key = 2;
								if (_property > 3) vipq2key = 3;
								if (_property > 7) vipq2key = 4;
								if (_property > 255) vipq2key = 5;
								if (vipq2key == 0)
									this.dInfoTxt += items[j].ItemDescTbl[vipq2key];
								for (var k = 0; k < vipq2key; k++)
									this.dInfoTxt += " " + items[j].ItemDescTbl[k + 1] + "\n";
							} else {
								this.dInfoTxt += " " + items[j].ItemDescTbl[0] + "\n";
							}
							break;
						}
					}
					// add notes
					if (dInfoTbl[i].Notes)
						this.dInfoTxt += "\n" + dInfoTbl[i].Notes + "\n";
					this.dInfoTxt += "\n";
				}
			},

			// Add thread information section from !extend command or VIPQ2_EXTDAT of the 1st. message in the thread
			addThrdSect: function (tInfoTbl) {
				for (var i = 0; i < tInfoTbl.length; i++) {
					// add heading
					this.tInfoTxt += "●" + tInfoTbl[i].Heading + "\n";
					// add items
					var items = tInfoTbl[i].objItems;
					if (this._parent.NoExtend) {
						this.tInfoTxt += " " + items[0] + "\n";
						break;
					}
					for (var j = 1; j < items.length; j++) {
						var _propName = items[j].propName;
						var _property = this._parent[_propName];
						this.tInfoTxt += " ";
						switch (_propName) {
						case 'Id':
						case 'Slip':
							this.tInfoTxt += items[j].ItemValues[_property];
							break;
						case 'Resmax':
						case 'Datmax':
							this.tInfoTxt += items[j].ItemName + "：" + _property;
							if (items[j].Unit)
								this.tInfoTxt += " " + items[j].Unit;
							break;
						case 'Dlevel':
							this.tInfoTxt += items[j].ItemName;
							if (_property)
								this.tInfoTxt += "：" + _property;
							else
								this.tInfoTxt += items[j].Default;
							break;
						case 'Cannon':
							if (_property)
								this.tInfoTxt += items[j].ItemValues[_property];
							else
								this.tInfoTxt += items[j].ItemValues[0];
							break;
						}
						this.tInfoTxt += "\n";
					}
					// add notes
					if (tInfoTbl[i].Notes)
						this.tInfoTxt += "\n" + tInfoTbl[i].Notes + "\n";
					this.tInfoTxt += "\n";
				}
			}
		};

		dngrContents.addGnrlSect(GeneralInfoTbl);
		dngrContents.addDngrSect(DonguriInfoTbl);
		dngrContents.addThrdSect(ThreadInfoTbl);
		this.DonguriTxt = dngrContents.getDngrTxt();
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

/*=============================================================================
******** Is the "for - of" statement NOT implemented in JScript? Why? *********
-------------------------------------------------------------------------------
 The "for - of" statement was added in June 2015, ES6(ES2015), ECMA-262.
 JScript is based on ECMA-262 5.1 to 9 (ES2018) edition at least
on the Windows 10 or later.
=============================================================================*/