"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import type { Locale } from "@/types/app";

const JA_TRANSLATIONS: Record<string, string> = {
  "3D Creative Studio": "3Dクリエイティブスタジオ",
  Settings: "設定",
  English: "English",
  Japanese: "日本語",
  "Back to Studio": "スタジオに戻る",
  "Step 1: Upload Image": "ステップ1: 画像アップロード",
  "Upload an image to generate a 3D model from it.":
    "画像をアップロードして3Dモデルを生成します。",
  "Checking credential status...": "認証情報の状態を確認中...",
  "Please configure both API credentials in":
    "先に両方のAPI認証情報を",
  "before proceeding.": "で設定してください。",
  "Next: Generate 3D Model": "次へ: 3Dモデル生成",
  "Upload an image": "画像をアップロード",
  "Click or drag & drop an image":
    "クリックまたはドラッグ&ドロップで画像を追加",
  "Uploaded preview": "アップロード画像プレビュー",
  "Step 2: Generate 3D Model": "ステップ2: 3Dモデル生成",
  "Convert your image to a 3D model using Hitem3D.":
    "Hitem3Dを使って画像を3Dモデルに変換します。",
  Source: "元画像",
  "Waiting in queue...": "キューで待機中...",
  "3D model generated!": "3Dモデルを生成しました！",
  "Generation failed": "生成に失敗しました",
  "Ready to generate": "生成準備完了",
  "Back Button": "戻る",
  "Generating...": "生成中...",
  "Generate 3D Model": "3Dモデルを生成",
  "Next: View & Screenshot": "次へ: 表示とスクリーンショット",
  "Step 3: View & Capture Screenshots":
    "ステップ3: 表示とスクリーンショット撮影",
  "Rotate the 3D model to your desired angle and capture screenshots. These will be used as reference for AI image generation.":
    "3Dモデルを任意の角度に回転し、スクリーンショットを撮影します。AI画像生成の参照画像として利用されます。",
  "Preset Angles": "プリセット角度",
  "Screenshot Label": "スクリーンショット名",
  "e.g., Front View": "例: 正面",
  "Captured Screenshots": "撮影済みスクリーンショット",
  "Next: Generate Images": "次へ: 画像生成",
  screenshots: "枚",
  "Capture Screenshot": "スクリーンショットを撮影",
  "No screenshots captured yet. Rotate the 3D model and capture angles you want to use.":
    "まだスクリーンショットがありません。3Dモデルを回転して必要な角度を撮影してください。",
  "No 3D model available. Please go back and generate one first.":
    "3Dモデルがありません。前のステップで先に生成してください。",
  "Step 4: AI Image Generation": "ステップ4: AI画像生成",
  "Generate new images using the original image and 3D screenshots as references.":
    "元画像と3Dスクリーンショットを参照して新しい画像を生成します。",
  "Reference Images": "参照画像",
  Original: "元画像",
  "Generating images...": "画像を生成中...",
  "Cancel Generation": "生成を中止",
  "Back to Screenshots": "スクリーンショットに戻る",
  "Start Over": "最初からやり直す",
  Preset: "プリセット",
  "Select a preset": "プリセットを選択",
  "Select Prompts": "プロンプトを選択",
  selected: "選択中",
  "Custom Prompt (optional - added to each generation)":
    "カスタムプロンプト（任意・各生成に追加）",
  "Add additional instructions...": "追加の指示を入力...",
  "Generated Images": "生成画像",
  "Download failed:": "ダウンロード失敗:",
  "Compressing...": "圧縮中...",
  "Download All (ZIP)": "すべてダウンロード（ZIP）",
  Download: "ダウンロード",
  Previous: "前へ",
  Next: "次へ",
  "Hitem3D API": "Hitem3D API",
  "Enter your Hitem3D Access Key and Secret Key, then save securely.":
    "Hitem3Dのアクセスキーとシークレットキーを入力し、安全に保存します。",
  "Enter your Hitem3D Access Key and API Key, then save securely.":
    "Hitem3DのアクセスキーとAPIキーを入力し、安全に保存します。",
  "Enter your Hitem3D username and password, then save securely.":
    "Hitem3Dのユーザー名とパスワードを入力し、安全に保存します。",
  "Access Key": "アクセスキー",
  Username: "ユーザー名",
  "Secret Key": "シークレットキー",
  "API Secret Key": "APIシークレットキー",
  Password: "パスワード",
  Hide: "非表示",
  Show: "表示",
  "Save Credentials": "認証情報を保存",
  "Validate & Check Balance": "検証して残高確認",
  "Clear Stored Credentials": "保存済み認証情報を削除",
  "Credentials are currently stored for this browser.":
    "このブラウザに認証情報が保存されています。",
  Balance: "残高",
  credits: "クレジット",
  "Gemini API": "Gemini API",
  "Enter your Google AI API key and validate it securely.":
    "Google AIのAPIキーを入力して安全に検証します。",
  "Get API key": "APIキーを取得",
  "API Key": "APIキー",
  "Validate & Save Key": "検証して保存",
  "Clear Stored Key": "保存済みキーを削除",
  "Gemini API key is currently stored for this browser.":
    "このブラウザにGemini APIキーが保存されています。",
  "API key is valid.": "APIキーは有効です。",
  "Setup Guide": "セットアップガイド",
  "1) Create a HitEM3D account and copy your Access Key / Secret Key.":
    "1) HitEM3Dアカウントを作成し、アクセスキー / シークレットキーを控えてください。",
  "1) Create a HitEM3D account and copy your Access Key / API Key.":
    "1) HitEM3Dアカウントを作成し、アクセスキー / APIキーを控えてください。",
  "1) Create a HitEM3D account and copy your username/password.":
    "1) HitEM3Dアカウントを作成し、ユーザー名/パスワードを控えてください。",
  "2) Create a Gemini API key from": "2) Gemini APIキーを",
  "Google AI Studio": "Google AI Studio",
  "3) Save both credentials on this page.":
    "3) このページで両方の認証情報を保存してください。",
  "Credentials are stored in secure HttpOnly cookies on this browser.":
    "認証情報はこのブラウザの安全なHttpOnly Cookieに保存されます。",
  "For production use, set `CREDENTIALS_COOKIE_SECRET` on the server.":
    "本番利用時はサーバーに `CREDENTIALS_COOKIE_SECRET` を設定してください。",
  Upload: "アップロード",
  "3D Generate": "3D生成",
  Screenshot: "撮影",
  "AI Generate": "AI生成",
  "Generate 3D model": "3Dモデルを生成",
  "Capture angles": "角度を撮影",
  "Generate new images": "新しい画像を生成",
  Front: "正面",
  Left: "左",
  Right: "右",
  Top: "上",
  "Front-Right": "右前",
  "Front-Left": "左前",
  "Low Angle": "ローアングル",
  "Camera Angles": "カメラアングル",
  "Lighting Variations": "ライティング",
  "Style Transform": "スタイル変換",
  "Close-up": "クローズアップ",
  "Right 45°": "右45°",
  "Aerial View": "俯瞰",
  "Left 45°": "左45°",
  "Left 90°": "左90°",
  "Right 90°": "右90°",
  "Wide Angle": "広角",
  "Golden Hour": "ゴールデンアワー",
  "Side Light": "サイドライト",
  Moonlight: "月光",
  Studio: "スタジオ",
  Neon: "ネオン",
  Backlight: "逆光",
  Rainbow: "レインボー",
  Mono: "モノクロ",
  Anime: "アニメ",
  "Oil Painting": "油絵",
  Watercolor: "水彩",
  "Pixel Art": "ピクセルアート",
  Sketch: "スケッチ",
  "3D Render": "3Dレンダー",
  Vintage: "ヴィンテージ",
  Comic: "コミック",
  "Custom Angle": "カスタム角度",
  Generate: "生成",
  Images: "枚",
  "Invalid uploaded image data. Please upload the image again.":
    "アップロード画像データが不正です。画像を再アップロードしてください。",
  "Invalid screenshot data:": "スクリーンショットデータが不正です:",
  "Failed to generate 3D model": "3Dモデルの生成に失敗しました",
  "Failed to save Hitem3D credentials.":
    "Hitem3D認証情報の保存に失敗しました。",
  "Credentials saved securely.": "認証情報を安全に保存しました。",
  "Unknown error": "不明なエラー",
  "Saving...": "保存中...",
  "Checking...": "確認中...",
  "Validating...": "検証中...",
  "Clearing...": "削除中...",
  "Failed to check balance.": "残高確認に失敗しました。",
  "Credentials verified.": "認証情報を確認しました。",
  "Failed to clear stored credentials.":
    "保存済み認証情報の削除に失敗しました。",
  "Stored credentials were cleared.": "保存済み認証情報を削除しました。",
  "Validation failed.": "検証に失敗しました。",
  "Failed to clear stored API key.": "保存済みAPIキーの削除に失敗しました。",
  "Generation was cancelled.": "生成はキャンセルされました。",
  "Timed out while waiting for 3D generation.":
    "3D生成の待機がタイムアウトしました。",
  "Invalid task status response.": "タスク状態レスポンスが不正です。",
  "3D generation failed.": "3D生成に失敗しました。",
  "Request failed.": "リクエストに失敗しました。",
  "Empty response.": "レスポンスが空です。",
  "Timed out while contacting the server.":
    "サーバー通信がタイムアウトしました。",
  "Generation cancelled.": "生成はキャンセルされました。",
  "Image generation request timed out.":
    "画像生成リクエストがタイムアウトしました。",
  "Image generation is taking too long. Please try fewer prompts.":
    "画像生成に時間がかかりすぎています。プロンプト数を減らして再試行してください。",
  "Gemini request timed out. Please try again.":
    "Geminiの応答がタイムアウトしました。再試行してください。",
  "Failed to generate image.": "画像生成に失敗しました。",
  "No image in response.": "レスポンスに画像がありません。",
  "Hitem3D credentials are not configured. Please register them in Settings.":
    "Hitem3D認証情報が未設定です。設定画面で登録してください。",
  "Gemini API key is not configured. Please set it in Settings.":
    "Gemini APIキーが未設定です。設定画面で登録してください。",
  "Authentication failed. Please check your credentials.":
    "認証に失敗しました。認証情報を確認してください。",
  "Access Key and Secret Key are required.":
    "アクセスキーとシークレットキーは必須です。",
  "Access Key and API Key are required.":
    "アクセスキーとAPIキーは必須です。",
  "Unable to reach Hitem3D. Please check API endpoint and try again.":
    "Hitem3Dに接続できません。APIエンドポイントを確認して再試行してください。",
  "Unable to reach Hitem3D. Please try again.":
    "Hitem3Dに接続できません。再試行してください。",
  "Failed to fetch balance from Hitem3D.":
    "Hitem3Dの残高取得に失敗しました。",
  "Unable to submit task. Please try again.":
    "タスク送信に失敗しました。再試行してください。",
  "Failed to submit task to Hitem3D.":
    "Hitem3Dへのタスク送信に失敗しました。",
  "Failed to query task status.": "タスク状態の取得に失敗しました。",
  "Unable to query task. Please try again.":
    "タスク状態の問い合わせに失敗しました。再試行してください。",
  "Invalid API key. Please check and try again.":
    "APIキーが無効です。確認して再試行してください。",
  "Image generation failed. Please try again.":
    "画像生成に失敗しました。再試行してください。",
  "Gemini did not return an image for this prompt.":
    "このプロンプトではGeminiから画像が返されませんでした。",
  "Prompt and reference images are required.":
    "プロンプトと参照画像は必須です。",
  "Invalid request body.": "リクエスト形式が不正です。",
  "Too many requests. Please try again shortly.":
    "リクエストが多すぎます。少し待ってから再試行してください。",
  "Forbidden request origin": "許可されていないリクエスト元です。",
  "An image file is required.": "画像ファイルが必要です。",
  "Only image files are supported.": "画像ファイルのみ対応しています。",
  "Image is too large. Please upload a file under 20MB.":
    "画像サイズが大きすぎます。20MB未満のファイルを使用してください。",
  "Missing task_id parameter.": "task_id パラメータがありません。",
  "Invalid task_id parameter.": "task_id パラメータが不正です。",
};

function translate(locale: Locale, text: string): string {
  if (locale !== "ja") return text;
  return JA_TRANSLATIONS[text] || text;
}

export function useI18n() {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);

  const t = useCallback(
    (text: string): string => translate(locale, text),
    [locale]
  );

  return {
    locale,
    setLocale,
    t,
    isJapanese: locale === "ja",
  };
}
