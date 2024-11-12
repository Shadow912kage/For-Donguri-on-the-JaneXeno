// SETTING.TXT�ƃX���� >>1 ����ǂ񂮂�ݒ�����擾�A�\�� ver.0.6.1
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
//
//  1st res top 
//   <> !extend:(ID):(SLIP):1000:512:donguri=(x/y) <br>
//  1st res bottom
//   <hr>VIPQ2_EXTDAT: (ID):(SLIP):1000:512:donguri=(x/y): EXT was configured <>
//

// �C������
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
	// Display donguri informations
	Disp: function() {
		// initalize
		this.Init();
		// display dialog window
		this.GetSettingTxt();
		this.ParseSettingTxt();
		this.GetDatDonguri();
		this.CreateDonguriTxt();
		this.Shell.Popup(this.DonguriTxt, 0, "�ǂ񂮂���");
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
			/* The Content-Type header is ineffective for getting SETTING.TXT at least on the 5ch.
			this.ReqHeaders = {"content-type" : "text/plain; charset=shift_jis"};
			*/
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
				this.ErrMsg = "�T�[�o�[����̉���������܂���";
				this.DispErr();
			};
		}
		try {
			http.open("GET", this.SettingTxtUrl, true);
			/* The Content-Type header is ineffective for getting SETTING.TXT at least on the 5ch.
			for (i in this.ReqHeaders)
				http.setRequestHeader(i, this.ReqHeaders[i]);
			*/
			http.send();
		} catch (e) {
			this.ErrMsg = "SETTING.TXT���擾�ł��܂���ł���"
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
		// The response header(.headers) of SETTING.TXT is empty... So the WinHttp treat strings as us-ascii.
		this.SettingTxt = http.ResponseText;
		/*
		var buf = http.ResponseBody;
		var strm = new ActiveXObject("ADODB.Stream");
		strm.Type = 2;
		strm.charset = "shift_jis";
		strm.Open();
		strm.WriteText(buf);
		strm.SaveToFile("SETTING.TXT", 2);
		strm.Close();
		*/
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
		/* EXCEPT BBS_TITLE, BBS_TITLE_ORIG and BBS_NONAME_NAME
		var title = this.SettingTxt.match(/BBS_TITLE=(.+)/);
		if (title)
			this.Title = title[1];
		var titleorig = this.SettingTxt.match(/BBS_TITLE_ORIG=(.+)/);
		if (titleorig)
			this.TitleOrig = titleorig[1];
		var noname = this.SettingTxt.match(/BBS_NONAME_NAME=(.+)/);
		if (noname)
			this.NoName = noname[1];
		*/
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
		// SETTING.TXT
		/// Other settings
		var dontxt = "���f���ݒ� (SETTING.TXT)\n";
		/* EXCEPT BBS_TITLE, BBS_TITLE_ORIG and BBS_NONAME_NAME
		if (this.Title)
				dontxt += " ���F" + this.Title;
			if (this.TitleOrig)
				dontxt += " (" + this.TitleOrig + ")";
			dontxt += "\n";
		if (this.NoName)
			dontxt += " �f�t�H���g�������F"  + this.NoName + "\n";
		*/
		if (this.NameLen)
			dontxt += " ���O�ő�o�C�g���F" + this.NameLen + "\n";
		if (this.MailLen)
			dontxt += " ���[���ő�o�C�g���F" + this.MailLen + "\n";
		if (this.MaxRows)
			dontxt += " �ő�s���F" + this.MaxRows + "\n";
		if (this.ResSize)
			dontxt += " �{���ő�o�C�g���F" + this.ResSize + "\n";
		if (this.SLIP)
			dontxt += " SLIP�F" + this.SLIP + "\n";
		if (this.DispIP)
			dontxt += " ���� IP addr.�\���F" + this.DispIP + "\n";
		if (this.ForceID)
			dontxt += " ���� ID �\���F" + this.ForceID + "\n";
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