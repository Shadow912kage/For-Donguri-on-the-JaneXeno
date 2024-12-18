//	Cannon God Exaxxion ver.0.1
//  	Usage: Exaxxion.js <thread URL> <local dat path> <res number>
//
//	================================= NOTICE! =================================
//  Only the Hunter can fire on the Acorn cannon.
//	Requires the Acorn pre-authenticated web browser to fire the Acorn cannon.
//	================================= NOTICE! =================================
//
//	On the JaneXeno
//		Commnad name: +<command name>, need "+" on the top of command name
// 		Command: wscript "$BASEPATHScript/Exaxxion.js" "$URL" "$LOCALDAT" $NUMBER

//	Version history
//		0.1: Initial release

/* References
	�ǂ񂮂�V�X�e��
	https://donguri.5ch.net/cannon
	�ǂ񂮂��C API
	https://donguri.5ch.net/api
	https://donguri.5ch.net/confirm?url=<url encoded "thread URL">&date=<url encoded "res JPN style date time">
*/

var Exaxxion = {
	version: "0.1",

	Fire:	function () {
		this.initialize();
		this.getTargetUrl();
		this.getTargetResDate();
		this.confirmedFire();
	},
	initialize: function () {
		this.WinTitle = "�ǂ񂮂��C (" + WScript.ScriptName + " ver." + this.version + ")";
		this.Shell = WScript.CreateObject("WScript.Shell"); // this.Shell.Run(URL);
		var acornBase = "https://donguri.5ch.net";
		var commands = {
			confirm:	"/confirm",	// Confirm for the Acorn cannon fire
														// Authenticate and verify user session details with the Acorn cookies
			// followings are NOT implemented
			fire:			"/fire",		// Fire the Acorn cannon
														// User authentication is performed via the Acorn cookies
			logout:		"/logout",	// Logout, Delete Acorns-related cookies
			login:		"/login",		// Login, Redirect to the /auth
			auth:			"/auth",		// Authenticate the present session cookie (Acorn) or
														// begin a new login sequence then get the required cookies
			// following is NOT the Acorn API
			form:			"/cannon"		// input form page
		};
		var params = {threadUrl: "url", targetDate: "date"};
		this.acornUrlPrams = {SchemeHost: acornBase, Path: commands, Query: params};
	},
	getTargetUrl: function () {
		var urls = this.ThreadUrl.match(/https:\/\/(([-0-9A-Za-z]+)\.5ch\.net)\/([-0-9A-Za-z]+)\//);
		if (urls) {
			this.encodedUrl = encodeURIComponent(this.ThreadUrl);
		} else {
			this.Shell.Popup("5�����˂�̌f���ł͂���܂���", 0, this.WinTitle);
			WScript.Quit();
		}
	},
	isAbleToFire: function (res) {
		var extendcmd = res.match(/<>( sssp:\/\/img\.5ch\.net\/ico\/[-\w!#\$%&'\(\)\*\+,\.:;=?]+? <br>)?\s+!extend:(.*?):(.*?):(\d+)?:(\d+)?(:donguri=(\d+)\/(\d))?:{0,2}\s+<br>/);
		var vipq2ext = res.match(/<hr>VIPQ2_EXTDAT: (.+?):(.+?):(\d+):(\d+):(donguri=(\d+)\/(\d))?: EXT was configured <>/);
		if (extendcmd && extendcmd[6] && (extendcmd[8] < 3))
			return true;
		if (vipq2ext && vipq2ext[5] && (vipq2ext[7] < 3))
			return true;
		return false;
	},
	getTargetResDate: function () {
		var fs = WScript.CreateObject("Scripting.FileSystemObject");
		var dat = fs.OpenTextFile(this.DatPath, 1, 0);
		for (var i = 0; i < this.ResNum; i++) {
			var res = dat.ReadLine();
			// Check whether to be able to fire the Acorn cannon or not on the thread.
			if ((i == 0) && !this.isAbleToFire(res)) {
				dat.Close();
				this.Shell.Popup("���̃X���b�h�ł͑�C�����Ă܂���", 0, this.WinTitle);
				WScript.Quit();
			}
		}
		dat.Close();
		var dateid = res.match(/<>(\d{4}\/\d{2}\/\d{2}\([�����ΐ��؋��y]\) \d{2}:\d{2}:\d{2}\.\d{2})(?: (?:(ID:[-+/0-9A-Za-z]+)��?)?)?(?: .)?( BE:[^<>]+)?<>/);
		if (dateid) {
			this.targetDate = dateid[1];
			this.encodedDate = encodeURIComponent(dateid[1]).replace("(", "%28").replace(")", "%29").replace("%20", "+");
			this.targetID = dateid[2];
		}
	},
	confirmedFire: function () {
		var msg = "�X���b�h�F" + this.ThreadUrl + "\n���X�ԁF" + this.ResNum + "\n���e���F"
		+ this.targetDate + "\nID�F" + this.targetID + "\n\n�ɁA�ǂ񂮂��C�������܂����H";
		var url = this.acornUrlPrams.SchemeHost + this.acornUrlPrams.Path.confirm
			+ "?" + this.acornUrlPrams.Query.threadUrl + "=" + this.encodedUrl
			+ "&" + this.acornUrlPrams.Query.targetDate + "=" + this.encodedDate;
		if (this.Shell.Popup(msg, 0, this.WinTitle, 1) == 1)
			this.Shell.Run(url);
	}
};

var args = WScript.Arguments;
if (args.length < 3) { // Arguments check
	var thisname = WScript.ScriptName;
	var message = "�����̐�������܂���I\n\n�g�p�@�F\n " + thisname + " 5ch�̃X���b�h��URL DAT�t�@�C���� ���X�ԍ�\n\nJaneXeno �̃R�}���h�ݒ��F\n" + "�@+(�R�}���h���̔C�ӂ̕�����)\n wscript \"$BASEPATHScript/" + thisname + "\" \"$URL\" \"$LOCALDAT\" $NUMBER";
	WScript.Echo(message);
	WScript.Quit();
}
Exaxxion.ThreadUrl = args(0);
Exaxxion.DatPath = args(1);
Exaxxion.ResNum = args(2);
Exaxxion.Fire();