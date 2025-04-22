// SETTING.TXT�ƃX���� >>1 ����ǂ񂮂�ݒ�����擾�A�\�� ver.0.6.7
//
//  Usage: getdonguri.js 5ch�̔�URL ���[�J���ۑ�����Ă���DAT�̃p�X
//
//  JaneXeno �� �c�[��(O) > �ݒ�(O)... > �@�\ > �R�}���h �ňȉ��̂悤�ɐݒ�
//   �R�}���h���F �ǂ񂮂���\��
//    (�C�ӂ̕�����)
//   ���s����R�}���h�F wscript "$BASEPATHScript/getdonguri.js" "$BURL" "$LOCALDAT"
//    (2�ڂ̃p���[���[�^�́AJaneXeno ���C���X�g�[�������t�H���_���� Script �Ƃ����t�H���_�� getdonguri.js �Ƃ����t�@�C�����Œu�����ꍇ)
//
//  �Q�l����
//
//   SETTING.TXT - �T�����˂�wiki
//   https://info.5ch.net/index.php/SETTING.TXT
//   BBS_SLIP - �T�����˂�wiki
//   https://info.5ch.net/index.php/BBS_SLIP
//   �V��VIPQ2 - �T�����˂�wiki
//   https://info.5ch.net/index.php/%E6%96%B0%E7%94%9FVIPQ2#!extend:
//
//   �R�}���h - 5ch�ǂ񂮂������܂Ƃ�wiki
//   https://donguri.wikiru.jp/?command
//
//   JScript�jScripting.FileSystemObject�ł�UTF-8�e�L�X�g������������BADODB.Stream���g���B - �����J�`
//   https://2ndart.hatenablog.com/entry/2022/08/07/155523
//   www2.wbs.ne.jp/~kanegon/doc/code.txt
//   http://www2.wbs.ne.jp/~kanegon/doc/code.txt
//
//  1st res top 
//   <>( sssp://img.5ch.net/ico/IMAGE.FILE(BE icon) <br>) !extend:(ID):(SLIP):(Max res. num.):(Max dat size KB):(donguri=x/y)(:) <br>
//  1st res bottom
//   <hr>VIPQ2_EXTDAT: ID:SLIP:Max res. num.:Max dat size KB:donguri=x/y: EXT was configured <>
//

// �C������
//  ver.0.6.7: Added checking for fake command line of '!extend:'
//  ver.0.6.6.1: Corrected regex patterns, '=\s*' to '='.
//  ver.0.6.6: Added description of the difference between past and modified
//           : SETTING.TXT regarding the Acorn configuration and writing for BBS.
//  ver.0.6.6pre.2: Corrected BBS_TITLE's regex pattern and behavior regarding the 'Title' property decision.
//                : Added processing BBS_BBX_PASS of the SETTING.TXT
//                : Corrected MaxRows' wrong value (BBS_LINE_NUMBER) from ver.0.6.3pre.2
//                : Added processing BBS_SUBJECT_COUNT and BBS_THREAD_TATESUGI
//                : And test code...
//  ver.0.6.6pre.1: Added information if according to SETTING.TXT is modified,
//                : visit a new board or bbsmenu.json cache is expired
//  ver.0.6.5: Added getting & processing a https://menu.5ch.net/bbsmenu.json//  ver.0.6.5pre.2: test code...
//  ver.0.6.5pre.1: Rewritten HTTP setup and process code
//  ver.0.6.4: Corrected regex begin/last part of !extend: command, [SPC] -> \s+.
//  ver.0.6.3: Added a User-Agent header to the HTTP request header
//           : Added an ETag value to the HTTP request "If-Not-Modified" header and check returned HTTP status
//           : Added caching an ETag value and the SETTING.TXT to EtagSettingTxt.Cache\<server name>.<board name>.txt file
//  ver.0.6.3pre.2: Be more simple and readable code
//  ver.0.6.3pre.1: Be more simple for the function ParseSettingTxt() using a hashtable
//  ver.0.6.2.1: Corrected unit of BBS_NAME_COUNT, BBS_MAIL_COUNT and BBS_MESSAGE_COUNT on the window (KB -> Bytes)
//  ver.0.6.2: Cleaned up source code
//  ver.0.6.2pre.2
//           : Added processing SETTING.TXT with ADODB.stream
//  ver.0.6.2pre.1
//           : Changed descriptions of SETTING.TXT,
//           : ���O�ő�o�C�g�� -> ���O���ő�o�C�g��,  ���[���ő�o�C�g�� -> ���[�����ő�o�C�g��, �ő�s�� -> �{���ő�s��
//           : Added version number display to the dialog window
//           : Added stream and file access with ADODB for JaneXeno's local setting.txt file
//           : Added BBS_TITLE, BBS_TITLE_ORIG and BBS_NONAME_NAME
//           : Added thread URL information
//           : WIP... processing SETTING.TXT from 5ch
//  ver.0.6.1: Added BBS_MAIL_COUNT
//  ver.0.6: Added general SETTING.TXT information, EXCEPT BBS_TITLE, BBS_TITLE_ORIG and BBS_NONAME_NAME
//         : Corrected parsing for BBS_USE_VIPQ2, regex (\d) -> (\d+)
//         : WIP... stream and file access with ADODB
//  ver.0.5: Corrected regexp with BE icon (sssp://~)
//  ver.0.4: Added max res. number & max dat size informastions
//         : Correct regexp. of required donguri level
//         : Added a process to handle commands with omitted parameters
//         : Correct regexps of donguri level & cannon availability with omitted parameters
//  ver.0.3.1: Corrected typo, "�ݒ肳�ꂢ�܂���" -> "�ݒ肳��Ă��܂���"
//  ver.0.3: Added thread donguri informations from local dat file
//         : Added a check on the number of arguments
//  ver.0.2.1: Corrected typo, "SETTINT.TXT" -> "SETTING.TXT"
//  ver.0.2: Added timeout process
//  ver.0.1: 1st release

var DispDonguriInfo = {
  // version number of getdonguri.js
  Version: "0.6.7",

  // Script configurations
  // bbsmenu.json cache expiration [sec]
//  bbsMenuCacheExprtn: 43200, // 43200 sec = 12 hours
  bbsMenuCacheExprtn: 86400, // 86400 sec = 24 hours
//  bbsMenuCacheExprtn: 172800, // 172800 sec = 48 hours

  // Flag to use local setting.txt of JaneXeno or not (false or true)
  useLocalSettingTxt: false,
//  useLocalSettingTxt: true,

  // Display donguri informations
  Disp: function() {
    // initalize
    this.Init();
    // display dialog window
    //this.GetBbsMenuJsonCache();
    this.GetLastModifyMngmntBrdsCache();
    this.GetBBSMenuJson();
    this.ParseBBSMenuJson();
    this.GetSettingTxt();
    this.ParseSettingTxt();
    this.GetDatDonguri();
    this.CreateDonguriTxt();
    this.AddUpdatedInfo();
    this.Shell.Popup(this.DonguriTxt, 0, this.WinTitle);
  },
  // Initialize object
  Init: function() {
    this.WinTitle = "�ǂ񂮂��� (" + WScript.ScriptName + " ver." + this.Version + ")";
    this.GetWindowsVersion();
    this.UserAgent = "Monazilla/1.00 GetDonguri.Js/" + this.Version +
    " Windows/" + this.WinVersion;
    this.Shell = new ActiveXObject("WScript.Shell");
    this.ErrMsg = "";
    this.SetupHttpReq();
    this.ParseBoardUrl();
    this.CreateCacheFolder();
    this.bbsMenuCacheExpired = false;
    this.bbsMenuJsonLastModify = 0;
    this.mngmntBoards = [];
  },
  // ref. windows - Find OS Name/Version using JScript - Stack Overflow
  //      https://stackoverflow.com/questions/351282/find-os-name-version-using-jscript
  GetWindowsVersion: function() {
    var objWMISrvc = GetObject("winmgmts:\\\\.\\root\\CIMV2");
    var enumItems = new Enumerator(objWMISrvc.ExecQuery("Select * From Win32_OperatingSystem"));
    var sys = enumItems.item();
    this.WinVersion = sys.Version;
  },
  SetupHttpReq: function() {
    // ref. XMLHttpRequest ���쐬���� (mixi ���L�A�[�J�C�u)
    //      https://loafer.jp/mixi/diary/class.xsp?2006-07-20-22-26
    var httpProgIdWinHttpTbl = [
    {ProgID: "WinHttp.WinHttpRequest.5.1", WinHttp: true}, // XP, 2K Pro SP3, Server 2003, 2K server SP3 or later
    {ProgID: "Msxml2.ServerXMLHTTP.6.0", WinHttp: true},   // unknown
    {ProgID: "Msxml2.ServerXMLHTTP.3.0",WinHttp: true},    // unknown
    {ProgID: "Msxml2.XMLHTTP.6.0", WinHttp: false},        // unknown
    {ProgID: "Msxml2.XMLHTTP.3.0", WinHttp: false}         // unknown
    ];
    for (i = 0; i < httpProgIdWinHttpTbl.length; i++) {
      try {
        this.httpReq = new ActiveXObject(httpProgIdWinHttpTbl[i].ProgID);
        this.useWinHttp = httpProgIdWinHttpTbl[i].WinHttp;
        break;
      } catch (e) {
        if (httpProgIdWinHttpTbl.length == i + 1)
          throw e;
      }
    }
    var TIME_OUT = 3000; // 3000 msec
    if (this.useWinHttp) {
      this.httpReq.SetTimeouts(TIME_OUT, TIME_OUT, TIME_OUT, TIME_OUT);
    } else {
      this.httpReq.timeout = TIME_OUT;
      this.httpReq.ontimeout = function() {
        this.ErrMsg = "�T�[�o�[����̉���������܂���";
        this.DispErr();
      }
    }
  },
  httpReqOnError: function(e, msg) {
    this.ErrMsg = msg + "\n";
    // ref. �X�N���v�g���g�p�����f�[�^�̎擾 - Win32 apps | Microsoft Learn
    // https://learn.microsoft.com/ja-jp/windows/win32/winhttp/retrieving-data-using-script
    this.ErrMsg += e + "\n";
    this.ErrMsg += "WinHTTP returned error: " + (e.number & 0xffff).toString() + "\n\n";
    this.ErrMsg += e.description;
    this.DispErr();
  },
  httpReqWaitForResponse: function() {
    if (this.useWinHttp) {
      if (!this.httpReq.WaitForResponse()) {
        this.ErrMsg = "�T�[�o�[����̉���������܂���";
        this.DispErr();
      }
    } else {
      while (this.httpReq.ReadyState < 4) {}
    }
  },
  ParseBoardUrl: function() {
    var Urls =
    this.BoardUrl.match(/https:\/\/(([-A-Za-z0-9]+)\.5ch\.net)\/([-A-Za-z0-9]+)\//);
    if (Urls) {
      this.ServerFullName = Urls[1]
      this.ServerName = Urls[2];
      this.BoardName = Urls[3];
      this.SettingTxtUrl = this.BoardUrl + "SETTING.TXT";
      this.BbsMenuJsonUrl = "https://menu.5ch.net/bbsmenu.json";
      //this.BbsMenuHtmlUrl = "https://menu.5ch.net/bbsmenu.html";
    } else {
      this.ErrMsg = "5�����˂�̌f���ł͂���܂���";
      this.DispErr();
    }
  },
  CreateCacheFolder: function () {
    var scrFolder =
    WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf("\\"));
    var cacheFolder = scrFolder + "\\EtagSettingTxt.Cache";
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    if (!fs.FolderExists(cacheFolder))
      fs.CreateFolder(cacheFolder);
    this.EtagSettingTxtFile = cacheFolder + "\\" + this.ServerName + "."
    + this.BoardName + ".txt";
    this.EtagSettingTxtPastFile = cacheFolder + "\\" + this.ServerName + "."
    + this.BoardName + ".past.txt";
    this.BbsMenuJsonFile = cacheFolder + "\\" + "bbsmenu.json";
    this.LstModMngmntBrdsFile = cacheFolder + "\\" + "lastmod-mngmntbrds.txt";
  },
  // Display error message & quit process
  DispErr: function() {
    this.Shell.Popup(this.ErrMsg, 0, "�G���[");
    WScript.Quit();
  },
  // Get the bbsmenu.json cache and the last modified date and time (Unixtime [sec])
  GetBbsMenuJsonCache: function() {
    var fs = WScript.CreateObject("Scripting.FileSystemObject");
    if (fs.FileExists(this.BbsMenuJsonFile)) {
      var strm = new ActiveXObject("ADODB.Stream");
      strm.Type = 2; // text
      strm.charset = "utf-8"; // UTF-8 BOM
      strm.Open();
      strm.LoadFromFile(this.BbsMenuJsonFile);
      this.BbsMenuJson = strm.ReadText();
      strm.Close();
      // parse bbsmenu.json, get "last_modify" value
      /* NOT implemented "JSON" on the JScript...
      var bbsMenuJsObj = JSON.parse(this.BbsMenuJson);
      this.bbsMenuJsonLastModify = bbsMenuJsObj.last_modify;
      for (propName in this.BbsMenuJson)
        if (propName == '"last_modify"')
          this.bbsMenuJsonLastModify = this.BbsMenuJson[propName];
      */
      var lstmod = this.BbsMenuJson.match(/"last_modify":\s*(\d{10}),?/);
      if (lstmod)
        this.bbsMenuJsonLastModify = lstmod[1];
    }
  },
  // Get last_modify and board URLs to the cache file
  GetLastModifyMngmntBrdsCache: function() {
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    if (fs.FileExists(this.LstModMngmntBrdsFile)) {
      var ts = fs.OpenTextFile(this.LstModMngmntBrdsFile, 1, 0);
      this.bbsMenuJsonLastModify = ts.ReadLine();
      for (var i = 0; !ts.AtEndOfStream; i++)
        this.mngmntBoards[i] = ts.ReadLine();
      ts.Close();
    }
  },
  // Get bbsmenu.json
  GetBBSMenuJson: function() {
    // bbsmenu.html's ETag checking...? instead of json's last_modify...
    // bbsmenu.html is created from bbsmenu.json every day, maybe...
    var date = new Date();
    var unixtimeNow = date.getTime() / 1000; // Date.getTime() unit is msec
    if ((unixtimeNow - this.bbsMenuJsonLastModify) > this.bbsMenuCacheExprtn)
      this.bbsMenuCacheExpired = true;
    if (this.mngmntBoards && !this.bbsMenuCacheExpired)
      return;

    try {
      this.httpReq.open("GET", this.BbsMenuJsonUrl, true);
      this.httpReq.setRequestHeader("User-Agent", this.UserAgent);
      this.httpReq.send();
    } catch (e) {
      this.httpReqOnError(e, this.BbsMenuJsonUrl + "���擾�ł��܂���ł���");
    }
    this.httpReqWaitForResponse();

    this.updateInfoObj.setCase("bbsMenuExprd");

    var strm = new ActiveXObject("ADODB.Stream");
    strm.Type = 1; // adTypeBinary
    strm.Open();
    strm.Write(this.httpReq.ResponseBody);
    strm.SaveToFile(this.BbsMenuJsonFile, 2); // over write
    strm.Type = 2; // adTypeText
    strm.Charset = "utf-8"; // UTF-8 BOM
    strm.LoadFromFile(this.BbsMenuJsonFile);
    this.BbsMenuJson = strm.ReadText();
    strm.Position = 0; // Reset writing position
    strm.WriteText(this.BbsMenuJson);
    strm.SaveToFile(this.BbsMenuJsonFile, 2); // over write
    strm.Close();
  },
  // Parse bbsmenu.json
  ParseBBSMenuJson: function() {
    if (!this.bbsMenuCacheExpired)
      return;
    // get the "last_modify" value from bbsmenu.json
    var lstmod = this.BbsMenuJson.match(/"last_modify":\s*(\d{10}),?/);
    if (lstmod)
      this.bbsMenuJsonLastModify = lstmod[1];
    // find out the boards dealing with deletion and management
    var mngmntBoardsBlk = this.BbsMenuJson.match(
    /"category_content":\s*\[(,?{([^{,]+,)*?"category_name":\s*"�^�c"(,[^,}]+)*?})+\]/);
    if (mngmntBoardsBlk) {
      var urlSects = mngmntBoardsBlk[0].match(/"url":\s*"([^"]+)"/g);
      if (urlSects) {
        for (var i = 0; i < urlSects.length; i++) {
          var board = urlSects[i].match(/"url":\s*"([^"]+)"/);
          if (board)
            this.mngmntBoards[i] = board[1];
        }
      }
    }
    // write last_modify and board URLs to the cache file
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    if (fs.FileExists(this.LstModMngmntBrdsFile))
      var ts = fs.OpenTextFile(this.LstModMngmntBrdsFile, 2, 0);
    else
      var ts = fs.CreateTextFile(this.LstModMngmntBrdsFile);
    ts.WriteLine(this.bbsMenuJsonLastModify);
    for (var i = 0; i < this.mngmntBoards.length; i++)
      ts.WriteLine(this.mngmntBoards[i]);
    ts.Close();
  },
  // Whether the specified board is dealing with management or not
  isMngmntBorad: function(board) {
    for (var i = 0; i < this.mngmntBoards.length; i++) {
      if (this.mngmntBoards[i] == board)
        return true;
    }
    return false;
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
      var jpnDay = ["��", "��", "��", "��", "��", "��", "�y"];
      var frmT =
      time.getFullYear() + "/" + zeroPad(Number(time.getMonth() + 1)) + "/" +
      zeroPad(time.getDate()) + "(" + jpnDay[time.getDay()] + ") " +
      zeroPad(time.getHours()) + ":" + zeroPad(time.getMinutes()) + ":" +
      zeroPad(time.getSeconds());
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
        this.SettingTxtETag = etag[1];
    }
  },
  // Move Etag and SETTING.TXT Cache to past file
  MoveEtagSettingTxtCacheToPast: function(){
    var fs = WScript.CreateObject("Scripting.FileSystemObject");
    if (fs.FileExists(this.EtagSettingTxtPastFile))
      fs.DeleteFile(this.EtagSettingTxtPastFile);  // Delete old past file
    if (fs.FileExists(this.EtagSettingTxtFile))
      fs.MoveFile(this.EtagSettingTxtFile, this.EtagSettingTxtPastFile);
  },
  // Get a SETTING.TXT on the 5ch board resource.
  Get5chSettingTxt: function() {
    try {
      this.httpReq.open("GET", this.SettingTxtUrl, true);
      this.httpReq.setRequestHeader("User-Agent", this.UserAgent);
      if (this.SettingTxtETag)
        this.httpReq.setRequestHeader("If-None-Match", this.SettingTxtETag);
      this.httpReq.send();
    } catch (e) {
      this.httpReqOnError(e, this.SettingTxtUrl + "���擾�ł��܂���ł���");
    }
    this.httpReqWaitForResponse();

    if (this.httpReq.Status == "304") // SETTING.TXT is NOT modified
      return;

    if (this.SettingTxtETag) {
      this.updateInfoObj.setCase("sttngTxtMdfd");
      this.SettingTxtPast = this.SettingTxt; // Save the past SETTING.TXT.
      this.MoveEtagSettingTxtCacheToPast(); // Move Etag and SETTING.TXT Cache to past file
    } else {
      this.updateInfoObj.setCase("newBoard");
    }

    this.SettingTxtETag = this.httpReq.GetResponseHeader("ETag");

/*=============================================================================
 The WinHttp treat strings as Latin-1 for ResponseText in the Content-Type
header w/o charset parameter.
 The ResponseBody is in some mysterious state.
Shift_JIS (the original encoding) encoded with UTF-16LE BOM encoding.
Probably because the HTTP communication is without a "content-type" header,
the sending site sends it in Shift_JIS,
and the receiving local side processes it as is with UTF-16LE BOM.
 NOooo... THERE IS a setting.txt file encoded with Shift_JIS in the JaneXeno's
local board folder.
=============================================================================*/
    // Ref. www2.wbs.ne.jp/~kanegon/doc/code.txt
    // http://www2.wbs.ne.jp/~kanegon/doc/code.txt
    var strm = new ActiveXObject("ADODB.Stream");
    strm.Type = 1; // adTypeBinary
    strm.Open();
    strm.Write(this.httpReq.ResponseBody);
    strm.Position = 2; // Skip BOM(FF FE), top of the ResponseBody(encoded with UTF-16)
    strm.SaveToFile(this.EtagSettingTxtFile, 2); // over write, raw SETTING.TXT
    strm.Type = 2; // adTypeText
    strm.Charset = "shift_jis";
    strm.LoadFromFile(this.EtagSettingTxtFile);
    this.SettingTxt = "ETag: " + this.SettingTxtETag + "\n"
    + strm.ReadText(); // Add an ETag value to the top of SETTING.TXT
    strm.Position = 0; // Reset writing position
    strm.WriteText(this.SettingTxt);
    strm.SaveToFile(this.EtagSettingTxtFile, 2); // over write, ETag value and SETTING.TXT
    strm.Close();
  },
  // Parse SETTING.TXT
  ParseSettingTxt: function() {
    // The hashtable between DispDonguriInfo's property and
    // its regex pattern for searching SETTING.TXT.
    for (var i = 0; i < SettingTxtPropRegexDesc.length; i++) {
      var modFlg = bFNotModfd;
      var item = this.SettingTxt.match(SettingTxtPropRegexDesc[i].Regex);
      if (item) {
        modFlg |= bFExistNow;
        SettingTxtPropRegexDesc[i].StItemName = item[1];
        SettingTxtPropRegexDesc[i].Prop = item[2];
        var _propName = SettingTxtPropRegexDesc[i].propName;
        switch (_propName) {
          case 'MaxRows':
            // The max message line number is BBS_LINE_NUMBER twice,
            // Enbuged missing from ver.0.6.3pre.2
            this[_propName] = item[2] * 2;
            break;
          case 'TateSugi':
            this[_propName] = item[3] + "/" + item[4];
            break;
          default :
            this[_propName] = item[2];
        }
      }

      if (this.SettingTxtPast) {
        var itemPast = this.SettingTxtPast.match(SettingTxtPropRegexDesc[i].Regex);
        if (itemPast) {
          modFlg |= bFExistPst;
          SettingTxtPropRegexDesc[i].StItemName = itemPast[1];
          SettingTxtPropRegexDesc[i].PastProp = itemPast[2];
          if ((modFlg & bFExistNow ) && (item[2] != itemPast[2]))
            modFlg |= bFModified;
        }
      }
      SettingTxtPropRegexDesc[i].ModFlg = modFlg; // set modified flag
    }
  },
  // Get 1st res. of local dat and parse it
  GetDatDonguri: function() {
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var dat = fs.OpenTextFile(this.DatPath, 1, 0);
    var dat1st = dat.ReadLine();
    dat.Close();
    var dngrtop = dat1st.match(/<>( sssp:\/\/img\.5ch\.net\/ico\/[-\w!#\$%&'\(\)\*\+,\.:;=?]+? <br>)?\s+!extend:(.*?):(.*?):(\d+)?:(\d+)?(:donguri=(\d+)\/(\d))?:{0,2}\s+<br>/);
    var dngrbtm = dat1st.match(/<hr>VIPQ2_EXTDAT: (.+?):(.+?):(\d+):(\d+):(donguri=(\d+)\/(\d))?: EXT was configured <>/);
    // Checking for "VIPQ2_EXTDAT:"
    if (dngrbtm) {
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
    // Checking for "!extend:" line is faked or not
    if (dngrtop) {
      if (this.Id != dngrtop[2])
        this.FakeExtend = true;
      if (this.Slip != dngrtop[3])
        this.FakeExtend = true;
      if (this.Resmax != (dngrtop[4] || "1000"))
        this.FakeExtend = true;
      if (this.Datmax != (dngrtop[5] || "512"))
        this.FakeExtend = true;
      if (dngrtop[6]) {
        if (this.Dlevel != dngrtop[7])
          this.FakeExtend = true;
        if (this.Cannon != dngrtop[8])
          this.FakeExtend = true;
      }
    }
  },
  // Create described text of the Donguri
  CreateDonguriTxt: function() {
    // General information table & object
    var urlItems = [
    {propName: 'BoardUrl', ItemName: "�f����URL", Unit: ""},
    {propName: 'ServerFullName', ItemName: "�T�[�o�[��", Unit: ""},
    {propName: 'BoardName', ItemName: "�f����", Unit: ""},
    {propName: 'DatNumber', ItemName: "dat�ԍ�", Unit: ""},
    {propName: 'ThreadTime', ItemName: "�X���b�h�쐬����", Unit: ""}];
    var settingtxtItems = [];
    var donguriItems = [];
    for (var i = 0; i < SettingTxtPropRegexDesc.length; i++) {
      switch (SettingTxtPropRegexDesc[i].sect) {
      case "Gen":
        settingtxtItems.push({
          propName: SettingTxtPropRegexDesc[i].propName,
          ItemName: SettingTxtPropRegexDesc[i].ItemName,
          Unit: SettingTxtPropRegexDesc[i].Unit
        });
        break;
      case "Don":
        donguriItems.push({
          propName: SettingTxtPropRegexDesc[i].propName,
          ItemName: SettingTxtPropRegexDesc[i].ItemName,
          ItemDescTbl: SettingTxtPropRegexDesc[i].ItemDescTbl
        });
        break;
      }
    }

    var GeneralInfoTbl = [
    {Heading: "URL���", objItems: urlItems,
     Notes: "5ch�ł̓X���b�h�쐬������UNIX time[msec]��1000�Ŋ���������������dat�ԍ��Ƃ��Ă���A���ꂪ������ꍇ��+1���Ă��܂��B���̂���dat�ԍ�����쐬�������t�Z����ƁA�~���b�����͕s���ƂȂ���ۂ̕b���Ƃ͈قȂ�ꍇ������܂��B"},
    {Heading: "�f���ݒ� (SETTING.TXT)", objItems: settingtxtItems,
     Notes: "SETTING.TXT�ɐݒ荀�ڂ͂���܂��񂪁A�X���b�h�̃��X�����1000�A�ő�dat�T�C�Y��512 KB �����ꂼ��̊���l�ł��B"}];

    // Donguri information table & object
    var DonguriInfoTbl = [
    {Heading: "�ǂ񂮂�֘A�ݒ� (SETTING.TXT)", objItems: donguriItems,
    Notes: "�^�c�n�ȊO�̔ł�BBS_USE_VIPQ2=2������l�ł��B"}];

    // Thread information table & object
    var idDescTbl = {
      "none": "ID�Ȃ�", "checked": "����ID", "default": "�̃f�t�H���gID�\��",
      "on": "�̃f�t�H���gID�\��", "": "�̃f�t�H���gID�\��"
    };
    var slipDescTbl = {
      "none": "SLIP�Ȃ� (ID�����Ȃ�)", "checked": "SLIP�Ȃ� (�Ȉ�ID����)",
      "feature": "SLIP�Ȃ� (��{ID����)", "verbose": "SLIP�Ȃ� (�ڍ�ID����)",
      "vvv": "�����ʂ̂� (�ڍ�ID����)", "vvvv": "������+IP addr. (�ڍ�ID����)",
      "vvvvv": "������+SLIP (�ڍ�ID����)", "vvvvvv": "������+SLIP+IP addr. (�ڍ�ID����)",
      "default": "�̃f�t�H���gSLIP (ID�����Ȃ�)", "on": "�̃f�t�H���gSLIP (ID�����Ȃ�)",
      "": "�̃f�t�H���gSLIP (ID�����Ȃ�)"
    };
    var cannonDescTbl = ["���x���\��/��C�͔̃f�t�H���g", "�������x���\��/��C��",
    "�C�Ӄ��x���\��/��C��", "�������x���\��/��C�s��", "�C�Ӄ��x���\��/��C�s��"];
    var threadItems = [
    "!extend: �R�}���h�͎g�p����Ă��܂���",
    "************** ���ӁF>>1 �� !extend: �s�͋U�����ꂽ���̂ł� **************",
    {propName: 'Id', ItemValues: idDescTbl},
    {propName: 'Slip', ItemValues: slipDescTbl},
    {propName: 'Resmax', ItemName: "���X���", Unit: ""},
    {propName: 'Datmax', ItemName: "�ő�dat�T�C�Y", Unit: "KB"},
    {propName: 'Dlevel', ItemName: "�K�v�ǂ񂮂背�x��", Default: "�͔̃f�t�H���g"},
    {propName: 'Cannon', ItemValues: cannonDescTbl}];
    var ThreadInfoTbl = [
    {Heading: "�X���b�h��� (!extend: �R�}���h)", objItems: threadItems, Notes: ""}];

    var dngrContents = {
      // ref. Javascript�Ŋ֐�������e�֐��̃v���p�e�B�ɃA�N�Z�X�������č������b�B - ���R���̊y�������׋�����
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
          this.gInfoTxt += "��" + gInfoTbl[i].Heading + "\n";
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
                this.gInfoTxt += " " + items[j].ItemName + "�F" + _property;
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
          this.dInfoTxt += "��" + dInfoTbl[i].Heading + "\n";
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
                // Added the description of the new feature from
                // http://kes.5ch.net/test/read.cgi/donguri/1734767867/181
                if (!this._parent.isMngmntBorad(this._parent.BoardUrl)) {
                  var vipq2key = 2;
                  for (var k = 0; k < vipq2key; k++)
                    this.dInfoTxt += " (" + items[j].ItemDescTbl[k + 1] + ")\n";
                }
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
          this.tInfoTxt += "��" + tInfoTbl[i].Heading + "\n";
          // add items
          var items = tInfoTbl[i].objItems;
          if (this._parent.NoExtend) {
            this.tInfoTxt += " " + items[0] + "\n\n";
            break;
          }
          if (this._parent.FakeExtend) {
            this.tInfoTxt += " " + items[1] + "\n";
          }
          for (var j = 2; j < items.length; j++) {
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
              this.tInfoTxt += items[j].ItemName + "�F" + _property;
              if (items[j].Unit)
                this.tInfoTxt += " " + items[j].Unit;
              break;
            case 'Dlevel':
              this.tInfoTxt += items[j].ItemName;
              if (_property)
                this.tInfoTxt += "�F" + _property;
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
  },

  // Updated information table & object
  // NOT implemented "Setter/Getter" on the JScript...
  updateInfoObj: {
    Heading: "�X�V���",
    bbsMenuExprdTxt: "bbsmenu.json�̃L���b�V�����X�V���܂���",
    sttngTxtMdfdTxt: "SETTING.TXT���ύX����܂���",
    newBoardTxt: "�V�K�̌f���ł�",
    sttngTxtNotes: "���X�N���v�g�ň����Ă��鍀�ڂɊւ��Ă̂�SETTING.TXT�̕ύX�_�̍��ق�\�����܂��B",
    UpdateInfoTxt: "",
    setCase: function(caseType) {
      switch (caseType) {
        case "bbsMenuExprd":
          this.UpdateInfoTxt += " " + this.bbsMenuExprdTxt;
          break;
        case "sttngTxtMdfd":
          this.UpdateInfoTxt += " " + this.sttngTxtMdfdTxt;
          this.Notes = this.sttngTxtNotes;
          break;
        case "newBoard":
          this.UpdateInfoTxt += " " + this.newBoardTxt;
          break;
        default:
      }
      this.UpdateInfoTxt += "\n";
    }
  },
  // Add updated information about bbsmenu.json cache expiration,
  // SETTING.TXT modification, and visiting a new board.
  AddUpdatedInfo: function () {
    if (!this.updateInfoObj.UpdateInfoTxt)
      return;

    if (this.SettingTxtPast) {
      for (var i = 0; i < SettingTxtPropRegexDesc.length; i++) {
        if (!SettingTxtPropRegexDesc[i].StItemName)
          continue;

        var modFlg = SettingTxtPropRegexDesc[i].ModFlg;
        if (modFlg & bFModified) { // modified
          var descStr = "  " + SettingTxtPropRegexDesc[i].ItemName +
          "���ύX����܂����F" + SettingTxtPropRegexDesc[i].StItemName +
          SettingTxtPropRegexDesc[i].PastProp + "��" +
          SettingTxtPropRegexDesc[i].Prop;
          if (this.getStrWidth(descStr) > 61) { // Shell.Popup window width is 61 characters in ASCII
            descStr = "  " + SettingTxtPropRegexDesc[i].ItemName +
            "���ύX����܂����F" + SettingTxtPropRegexDesc[i].StItemName + "\n   " +
            SettingTxtPropRegexDesc[i].PastProp + "\n    ��\n   " +
            SettingTxtPropRegexDesc[i].Prop;
          }
          this.updateInfoObj.UpdateInfoTxt += descStr + "\n";
        }    
        switch (modFlg) {
          case bFExistPst: // removed
            this.updateInfoObj.UpdateInfoTxt += "  " + SettingTxtPropRegexDesc[i].ItemName +
            "���폜����܂����F" + SettingTxtPropRegexDesc[i].StItemName +
            SettingTxtPropRegexDesc[i].PastProp + "\n";
            break;
          case bFExistNow: // added
            this.updateInfoObj.UpdateInfoTxt += "  " + SettingTxtPropRegexDesc[i].ItemName +
            "���ǉ�����܂����F" + SettingTxtPropRegexDesc[i].StItemName +
            SettingTxtPropRegexDesc[i].Prop + "\n";
            break;
        }
      }
    }

    this.DonguriTxt += "��" + this.updateInfoObj.Heading + "\n"
    + this.updateInfoObj.UpdateInfoTxt;
    // add notes
    if (this.updateInfoObj.Notes)
      this.DonguriTxt += "\n" + this.updateInfoObj.Notes + "\n";
    this.DonguriTxt += "\n";
  },
  // Shell.Popup window width is 61 characters in ASCII
  // and 33 characters in multi-bytes (character width retio: 1.84...).
  getStrWidth: function (str) {
    var width = 0;
    for (var i = 0; i  < str.length; i++) {
      if (str.charAt(i) < 0x7f)
        width++;
      else
        width += 1.85; // 61/33 = 1.848484...
    }
    return width;
  }
}

// SettingTxtPropRegexDesc ModFlg's bits fields:
var bFNotModfd = 0x00; // 0b00xx: not modified
var bFExistNow = 0x01; // 0b0xx1: exist now
var bFExistPst = 0x02; // 0b0x1x: exist past
var bFModified = 0x04; // 0b01xx: modified

var SettingTxtPropRegexDesc = [
  // Other board settings
  {sect: "Gen", propName: 'TitleOrig', Regex: /(BBS_TITLE_ORIG\s*=)(\S+)/,
  ItemName: "��", Unit: "", ModFlg: 0x00, StItemName: "",
  PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'Title',
  // For some reason, this regular expression will search to the end of
  // the document unless you suppress the end of the line with '\r'.
  // Probably because the negated character set '[^xyz]' also matches
  // the newline characters CR and LF.
  Regex: /(BBS_TITLE\s*=)([^��\(\)@��]+)([\(�i]��[\)�j])?([@��][25]ch�f����)?\r/,
  ItemName: "��", Unit: "", ModFlg: 0x00, StItemName: "",
  PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'NoName', Regex: /(BBS_NONAME_NAME\s*=)(\S+)/,
  ItemName: "�f�t�H���g������", Unit: "", ModFlg: 0x00, StItemName: "",
  PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'SubjLen', Regex: /(BBS_SUBJECT_COUNT\s*=)(\d+)/,
  ItemName: "�X���b�h�^�C�g���ő�o�C�g��", Unit: "Bytes",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'NameLen', Regex: /(BBS_NAME_COUNT\s*=)(\d+)/,
  ItemName: "���O���ő�o�C�g��", Unit: "Bytes",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'MailLen', Regex: /(BBS_MAIL_COUNT\s*=)(\d+)/,
  ItemName: "���[�����ő�o�C�g��", Unit: "Bytes",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'MaxRows', Regex: /(BBS_LINE_NUMBER\s*=)(\d+)/,
  ItemName: "�{���ő�s��", Unit: "�s",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'ResSize', Regex: /(BBS_MESSAGE_COUNT\s*=)(\d+)/,
  ItemName: "�{���ő�o�C�g��", Unit: "Bytes",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'TateSugi',
  Regex: /(BBS_THREAD_TATESUGI\s*=)(donguri:(\d)\/(\d+))/,
  ItemName: "�X�����ĂɕK�v�Ȃǂ񂮂背�x��/TATESUGI�l", Unit: "",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'DispIP', Regex: /(BBS_DISP_IP\s*=)(\S+)/,
  ItemName: "���� IP addr.�\��", Unit: "",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'ForceID', Regex: /(BBS_FORCE_ID\s*=)(\S+)/,
  ItemName: "���� ID �\��", Unit: "",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'SLIP', Regex: /(BBS_SLIP\s*=)(\S+)/,
  ItemName: "SLIP", Unit: "",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'BEID', Regex: /(BBS_BE_ID\s*=)(\d)/,
  ItemName: "BE���O�C��", Unit: "",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'NoID', Regex: /(BBS_NO_ID\s*=)(\S+)/
  , ItemName: "ID��\��", Unit: "",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  {sect: "Gen", propName: 'BBxPass', Regex: /(BBS_BBX_PASS\s*=)(\S+)/,
  ItemName: "BBx�K���s�K�p", Unit: "",
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""},
  // Donguri
  {sect: "Don", propName: 'Acorn', Regex: /(BBS_ACORN\s*=)(\d)/,
  ItemName: "BBS_ACORN", ItemDescTbl: ["(�ǂ񂮂�) �͐ݒ肳��Ă��܂���", "�ǂ񂮂背�x�������\��",
  "�ǂ񂮂背�x����\�� (�C�ӕ\��)"], ModFlg: 0x00, StItemName: "",
  PastProp: "", Prop: ""},
  {sect: "Don", propName: 'VipQ2', Regex: /(BBS_USE_VIPQ2\s*=)(\d+)/,
  ItemName: "BBS_USE_VIPQ2", ItemDescTbl: ["(VIPQ2�R�}���h) �͐ݒ肳��Ă��܂���",
  "!chkBBx: ���g�p��", "!extend: �����g�p��", "VI1PQ2 �R�}���h�g�p���ɁA�i�ʂ�\��",
  "!chkBBx: �g�p���ɃX�}�z�n�̓z�X�g�����ꕔ�ϊ�", "(�������H�g�p�s�H)"],
  ModFlg: 0x00, StItemName: "", PastProp: "", Prop: ""}
];

var args = WScript.Arguments;
if (args.length < 2) { // Arguments check
  var thisname = WScript.ScriptName;
  var message = "�����̐�������܂���I\n\n�g�p�@�F\n " + thisname
  + " 5ch�̔�URL DAT�t�@�C����\n\nJaneXeno �̃R�}���h�ݒ��F\n"
  + " wscript \"$BASEPATHScript/" + thisname + "\" \"$BURL\" \"$LOCALDAT\"";
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