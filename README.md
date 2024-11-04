# RelplaceStr.txt and Script for Donguri, on the JaneXeno.

## ReplaceStr.txt
JaneXeno をインストールしているフォルダ下の ReplaceStr.txt へ ReplaceStrDonguri.txt の内容を追加してください(要、JaneXeno 再起動)。

## Script
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

## References:
-[SETTING.TXT - ５ちゃんねるwiki](https://info.5ch.net/index.php/SETTING.TXT)<br>
-[BBS_SLIP - ５ちゃんねるwiki](https://info.5ch.net/index.php/BBS_SLIP)<br>
-[新生VIPQ2 - ５ちゃんねるwiki](https://info.5ch.net/index.php/%E6%96%B0%E7%94%9FVIPQ2#!extend:)<br>
-[コマンド - 5chどんぐり非公式まとめwiki](https://donguri.wikiru.jp/?command)<br>
