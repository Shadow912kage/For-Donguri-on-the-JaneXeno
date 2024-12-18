# RelplaceStr.txt and Script for Donguri, on the JaneXeno.
JaneXeno 用の !extend: コマンドを使用されたスレッドでの、どんぐり情報を表示するための ReplaceStr.txt 用のファイル ReplaceStrDonguri.txt と、掲示板での設定(SETTING.TXT)及び ReplaceStrDonguri.txt と同様の情報を表示するためのコマンドスクリプト getdonguri.js です。<br>
<br>
ReplaceStrDonguri.txt と getdonguri.js は独立した存在ですので、それぞれ別個にインストール可能です。

## ReplaceStr.txt
JaneXeno をインストールしているフォルダ下の ReplaceStr.txt へ ReplaceStrDonguri.txt の内容を追加してください(要、JaneXeno 再起動)。

## getdonguri.js
JaneXeno をインストールしているフォルダ下のスクリプトを置いているフォルダへ getdonguri.js を置いてください(以下は Script フォルダに置いたものとして説明します)。
```
***** 注意 *****
ver.0.3以降スクリプトの引数が増えたので、コマンド登録を以下のようにやり直してください。
(Xeno の設定では既登録の再編集はうまくいかなかったはず)
もしくは Xeno起動前に直接 command.txt を編集してください。
=====
JaneXeno の ツール(O) > 設定(O)... > 機能 > コマンド で以下のように設定
　コマンド名： どんぐり情報表示
　　(任意の文字列)
　実行するコマンド： wscript "$BASEPATHScript/getdonguri.js" "$BURL" "$LOCALDAT"
　　(2つ目のパラーメータは、JaneXeno をインストールしたフォルダ下の
　　 Script というフォルダに getdonguri.js というファイル名で置いた場合)
=====
```
## Exaxxion.js
どんぐり大砲用のスクリプトです。ハンターでないと大砲は撃てません。
<br>Shift_JIS/CRLFに修正しました。Raw file ダウロードでもそのままご利用いただけます。
```
JaneXeno の ツール(O) > 設定(O)... > 機能 > コマンド で以下のように設定
　コマンド名： +どんぐり大砲
　　(先頭に「+」を付けた任意の文字列、レス番メニューのみに表示)
　実行するコマンド： wscript "$BASEPATHScript/Exaxxion.js" "$URL" "$LOCALDAT" $NUMBER
　　(2つ目のパラーメータは、JaneXeno をインストールしたフォルダ下の
　　 Script というフォルダに Exaxxion.js というファイル名で置いた場合)
```
## その他
「JaneXeno 用の」と銘打っていますが、Jane系の専用ブラウザなら一応使えるようです。ただし当方では JaneXeno 以外での動作確認はいたしませんし、今後する予定もありませんのであしからず。「こう変更すれば～でも動作します」といったパッチは大歓迎です。

## References:
-[SETTING.TXT - ５ちゃんねるwiki](https://info.5ch.net/index.php/SETTING.TXT)<br>
-[BBS_SLIP - ５ちゃんねるwiki](https://info.5ch.net/index.php/BBS_SLIP)<br>
-[新生VIPQ2 - ５ちゃんねるwiki](https://info.5ch.net/index.php/%E6%96%B0%E7%94%9FVIPQ2#!extend:)<br>
-[コマンド - 5chどんぐり非公式まとめwiki](https://donguri.wikiru.jp/?command)<br>
