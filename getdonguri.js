// SETTING.TXT�ƃX���� >>1 ����ǂ񂮂�ݒ�����擾�A�\�� ver.0.6.2
//
//  Usage: getdonguri.js 5ch�̔�URL ���[�J���ۑ�����Ă���DAT�̃p�X
//
//	JaneXeno �� �c�[��(O) > �ݒ�(O)... > �@�\ > �R�}���h �ňȉ��̂悤�ɐݒ�
//	 �R�}���h���F �ǂ񂮂���\��
//		(�C�ӂ̕�����)
//	 ���s����R�}���h�F wscript "$BASEPATHScript/getdonguri.js" "$BURL" "$LOCALDAT"
//		(2�ڂ̃p���[���[�^�́AJaneXeno ���C���X�g�[�������t�H���_���� Script �Ƃ����t�H���_�� getdonguri.js �Ƃ����t�@�C�����Œu�����ꍇ)
//
//  �Q�l����
//
//	 SETTING.TXT - �T�����˂�wiki
//	 https://info.5ch.net/index.php/SETTING.TXT
//	 BBS_SLIP - �T�����˂�wiki
//	 https://info.5ch.net/index.php/BBS_SLIP
//	 �V��VIPQ2 - �T�����˂�wiki
//	 https://info.5ch.net/index.php/%E6%96%B0%E7%94%9FVIPQ2#!extend:
//
//   �R�}���h - 5ch�ǂ񂮂������܂Ƃ�wiki
//   https://donguri.wikiru.jp/?command
//
//	 JScript�jScripting.FileSystemObject�ł�UTF-8�e�L�X�g������������BADODB.Stream���g���B - �����J�`
//	 https://2ndart.hatenablog.com/entry/2022/08/07/155523
//	 www2.wbs.ne.jp/~kanegon/doc/code.txt
//	 http://www2.wbs.ne.jp/~kanegon/doc/code.txt
//
//  1st res top 
//   <>( sssp://img.5ch.net/ico/IMAGE.FILE(BE icon) <br>) !extend:(ID):(SLIP):(Max res. num.):(Max dat size KB):(donguri=x/y)(:) <br>
//  1st res bottom
//   <hr>VIPQ2_EXTDAT: ID:SLIP:Max res. num.:Max dat size KB:donguri=x/y: EXT was configured <>
//

// �C������
//	ver.0.6.2: Cleaned up source code
//	ver.0.6.2pre.2
//					 : Added processing SETTING.TXT with ADODB.stream
//	ver.0.6.2pre.1
//           : Changed descriptions of SETTING.TXT,
//	         : ���O�ő�o�C�g�� -> ���O���ő�o�C�g��,  ���[���ő�o�C�g�� -> ���[�����ő�o�C�g��, �ő�s�� -> �{���ő�s��
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
//	ver.0.3.1: Corrected typo, "�ݒ肳�ꂢ�܂���" -> "�ݒ肳��Ă��܂���"
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
		this.WinTitle = "�ǂ񂮂��� (" + WScript.ScriptName + " ver." + this.Version + ")",
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
			this.ErrMsg = "5�����˂�̌f���ł͂���܂���";
			this.DispErr();
		};
	},
	// Display error message & quit process
	DispErr: function() {
		this.Shell.Popup(this.ErrMsg, 0, "�G���[");
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
				this.ErrMsg = "�T�[�o�[����̉���������܂���";
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
			this.ErrMsg = "SETTING.TXT���擾�ł��܂���ł���\n�G���[�R�[�h�F" + e;
			this.DispErr();
		}
		if (USED_WINHTTP) {
			if (!http.WaitForResponse()) {
				this.ErrMsg = "�T�[�o�[����̉���������܂���";
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
		var title1 = this.SettingTxt.match(/BBS_TITLE=(.+)([@��][25]ch�f����)/);
		var title3 = this.SettingTxt.match(/BBS_TITLE=(.+)/);
		if (title1) {
			this.Title = title1[1];
			var title2 = title1[1].match(/(.+)((\(|�i)��(\)|�j))/);
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
		var dontxt = "��URL���\n";
		dontxt += " �f����URL�F" + this.BoardUrl + "\n";
		dontxt += " �T�[�o�[���F" + this.ServerFullName + "\n";
		dontxt += " �f�����F" + this.BoardName + "\n";
		dontxt += " dat�ԍ��F" + this.DatNumber + "\n";
		var jpnDay = ["��", "��", "��", "��", "��", "��", "�y"];
		var ThrdFormTime = this.ThreadTime.getFullYear() + "/" + zeroPad(Number(this.ThreadTime.getMonth() + 1)) + "/" + zeroPad(this.ThreadTime.getDate()) + "(" + jpnDay[this.ThreadTime.getDay()] + ") " + zeroPad(this.ThreadTime.getHours()) + ":" + zeroPad(this.ThreadTime.getMinutes()) + ":" + zeroPad(this.ThreadTime.getSeconds());
		dontxt += " �X���b�h�쐬�����F" + ThrdFormTime + "\n";
		dontxt += "\n5ch �ł̓X���b�h�쐬������ UNIX time �� 1000 �Ŋ��������������� dat�ԍ��Ƃ��Ă���A���ꂪ������ꍇ�� +1 ���Ă��܂��B���̂��� dat�ԍ�����쐬�������t�Z����ƁA�~���b�����͕s���ƂȂ���ۂ̕b���Ƃ͈قȂ�ꍇ������܂��B\n";
		dontxt += "\n";
		function zeroPad(num) {
			if (Number(num) < 10)
				return ("0" + String(num));
			return (num);
		};

		// SETTING.TXT
		/// Other settings
		dontxt += "���f���ݒ� (SETTING.TXT)\n";
		if (this.TitleOrig)
			dontxt += " ���F" + this.TitleOrig;
		else if (this.Title)
			dontxt += " ���F" + this.Title;
		dontxt += "\n";
		if (this.NoName)
			dontxt += " �f�t�H���g�������F"  + this.NoName + "\n";
		if (this.NameLen)
			dontxt += " ���O���ő�o�C�g���F" + this.NameLen + " KB\n";
		if (this.MailLen)
			dontxt += " ���[�����ő�o�C�g���F" + this.MailLen + " KB\n";
		if (this.MaxRows)
			dontxt += " �{���ő�s���F" + this.MaxRows + " �s\n";
		if (this.ResSize)
			dontxt += " �{���ő�o�C�g���F" + this.ResSize + " KB\n";
		if (this.DispIP)
			dontxt += " ���� IP addr.�\���F" + this.DispIP + "\n";
		if (this.ForceID)
			dontxt += " ���� ID �\���F" + this.ForceID + "\n";
		if (this.SLIP)
			dontxt += " SLIP�F" + this.SLIP + "\n";
		if (this.BEID)
			dontxt += " BE���O�C���F" + this.BEID + "\n";
		if (this.NoID)
			dontxt += " ID��\���F" + this.NoID + "\n";

		/// Donguri
		var acorntxt = [" (�ǂ񂮂�͐ݒ肳��Ă��܂���?)", " �ǂ񂮂背�x�������\��", " �ǂ񂮂背�x����\�� (�C�ӕ\��)"];
		var vipq2txt = [" (�f�t�H���g�ݒ�H)", " !chkBBx: ���g�p��\n", " !extend: �����g�p��\n", " VI1PQ2 �R�}���h�g�p���ɁA�i�ʂ�\��\n",
		" !chkBBx: �g�p���ɃX�}�z�n�̓z�X�g�����ꕔ�ϊ�\n", " (�������H�g�p�s�H)\n"];
		dontxt += "\n���ǂ񂮂�֘A�ݒ� (SETTING.TXT)\n";
		if (this.Acorn) {
			dontxt += " BBS_ACORN=" + this.Acorn.toString() + "\n";
			dontxt += acorntxt[this.Acorn] + "\n\n";
		} else {
			dontxt += " BBS_ACORN (�ǂ񂮂�) �͐ݒ肳��Ă��܂���\n\n";
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
			dontxt += " BBS_USE_VIPQ2 (VIPQ2�R�}���h) �͐ݒ肳��Ă��܂���\n";
		}
		// !extend: command in 1st res. of local dat file
		dontxt += "\n���X���b�h��� (!extend: �R�}���h)\n";
		if (this.Id || this.Slip || this.Dlevel || this.Cannon) {
			switch (this.Id) {
				case "none":
					dontxt += " ID�Ȃ�\n";
					break;
				case "checked":
					dontxt += " ����ID\n";
					break;
				case "default":
				case "on":
				default:
					dontxt += " �̃f�t�H���gID�\��\n";
			}
			switch (this.Slip) {
				case "none":
					dontxt += " SLIP�Ȃ� (ID�����Ȃ�)\n";
					break;
				case "checked":
					dontxt += " SLIP�Ȃ� (�Ȉ�ID����)\n";
					break;
				case "feature":
					dontxt += " SLIP�Ȃ� (��{ID����)\n";
					break;
				case "verbose":
					dontxt += " SLIP�Ȃ� (�ڍ�ID����)\n";
					break;
				case "vvv":
					dontxt += " �����ʂ̂� (�ڍ�ID����)\n";
					break;
				case "vvvv":
					dontxt += " ������+IP addr. (�ڍ�ID����)\n";
					break;
				case "vvvvv":
					dontxt += " ������+SLIP (�ڍ�ID����)\n";
					break;
				case "vvvvvv":
					dontxt += " ������+SLIP+IP addr. (�ڍ�ID����)\n";
					break;
				case "default":
				case "on":
				default:
					dontxt += " �̃f�t�H���gSLIP (ID�����Ȃ�)\n";
			}
			dontxt += " ���X����F" + this.Resmax + "\n �ő�dat�T�C�Y�F" + this.Datmax + " KB\n";
			if (this.Dlevel)
				dontxt += " �K�v�ǂ񂮂背�x���F" + this.Dlevel + "\n";
			else
				dontxt += " �K�v�ǂ񂮂背�x���͔̃f�t�H���g\n"
			switch (this.Cannon) {
				case "1":
					dontxt += " �������x���\��/��C��\n";
					break;
				case "2":
					dontxt += " �C�Ӄ��x���\��/��C��\n";
					break;
				case "3":
					dontxt += " �������x���\��/��C�s��\n";
					break;
				case "4":
					dontxt += " �C�Ӄ��x���\��/��C�s��\n";
					break;
				default:
					dontxt += " ���x���\��/��C�͔̃f�t�H���g\n";
			}
		} else {
			dontxt += " !extend: �R�}���h�͎g�p����Ă��܂���";
		}
		this.DonguriTxt = dontxt;
	}
}

var args = WScript.Arguments;
if (args.length < 2) { // Arguments check
	var thisname = WScript.ScriptName;
	var message = "�����̐�������܂���I\n\n�g�p�@�F\n " + thisname + " 5ch�̔�URL DAT�t�@�C����\n\nJaneXeno �̃R�}���h�ݒ��F\n" + " wscript \"$BASEPATHScript/" + thisname + "\" \"$BURL\" \"$LOCALDAT\"";
	WScript.Echo(message);
	WScript.Quit();
}
DispDonguriInfo.BoardUrl = args(0);
DispDonguriInfo.DatPath = args(1);
DispDonguriInfo.Disp();