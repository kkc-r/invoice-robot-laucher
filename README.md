# Turmeric-R

## 実行アプリ（Electron + React + TypeScript）

### 実行時の注意点

- デフォルトの RSI 接続先は na
- RSI 接続先を devu にしたい場合は、起動オプションとして`--devu`を指定する

### スクリプト

- `build`：レンダー側（src 配下）のソースをビルドする
- `electron:build` : electron 側（electron 配下）のソースをビルドして難読化する
- `obfuscator` : electron 側のビルドソースを難読化する
- `electron:build-win-x64:dev` : インストーラを作成する（開発用にソースマップは有効）
- `electron:build-win-x64` : インストーラを作成する（本番用にソースマップは無効）
