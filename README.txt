qpath 総集版

このフォルダは、qpath の現在の完成版です。
GitHub Pages へ公開する場合は、このフォルダの中身を qpath 用リポジトリのルートに配置してください。

入っているもの
- index.html: GitHub Pages の入口
- src: qpath の画面・機能・スタイル
- vendor: React / Firebase / アイコンのローカル実行用ファイル
- firestore.rules: Firebase Firestore のルール
- firebase.json / .firebaserc: Firebase Hosting 用の設定
- 404.html: GitHub Pages での画面遷移補助

GitHubへ置く際の注意
- ZIPそのものではなく、展開後の「中身」を qpath のリポジトリへアップロードします。
- index.html はリポジトリ直下に置きます。
- src と vendor はフォルダごとアップロードします。
- 単語帳のリポジトリには入れません。

主な機能
- 生徒・教員ロールとクラスコード参加
- クラスごとの利用者ID
- クイズ作成・編集・回答・連続出題
- 全体から回す / 科目ごとに回す
- トーク、返信、リアクション
- プロフィールと学習傾向
- 教員ダッシュボード
- 開発者IDによるクイズ管理
