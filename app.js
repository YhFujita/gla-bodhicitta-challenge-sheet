/**
 * 菩提心チャレンジシート（第2版） - GLAシートアプリ
 * メインスクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------------------------
  // 要素の取得
  // ---------------------------------------------------------------------------
  const fieldIds = [
    'memberId',
    'terminal',
    'userName',
    'bornReality',
    'mindName',
    'bodhicittaText',
    'habitualTransmission',
    'habitualReception',
    'newTransmission',
    'newReception',
    'actionText',
    'exerciseText',
    'metChaos'
  ];

  const fields = {};
  fieldIds.forEach(id => {
    fields[id] = document.getElementById(id);
  });

  const sheetScaleWrapper = document.getElementById('sheetScaleWrapper');
  const challengeSheet = document.getElementById('challengeSheet');
  const diagramLayer = document.getElementById('diagramLayer');
  const saveToast = document.getElementById('saveToast');

  // ツールバー操作要素
  const zoomSlider = document.getElementById('zoomSlider');
  const zoomVal = document.getElementById('zoomVal');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomFitBtn = document.getElementById('zoomFitBtn');

  const bgOpacitySlider = document.getElementById('bgOpacitySlider');
  const bgOpacityVal = document.getElementById('bgOpacityVal');

  const sampleBtn = document.getElementById('sampleBtn');
  const saveLocalBtn = document.getElementById('saveLocalBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const importJsonInput = document.getElementById('importJsonInput');
  const printBtn = document.getElementById('printBtn');
  const clearBtn = document.getElementById('clearBtn');

  const STORAGE_KEY = 'gla_bodhicitta_challenge_sheet_data_v2';
  const SETTINGS_KEY = 'gla_bodhicitta_sheet_settings';

  // ---------------------------------------------------------------------------
  // サンプルデータ（記入例）
  // ---------------------------------------------------------------------------
  const sampleData = {
    memberId: 'G123456',
    terminal: '東京ターミナル',
    userName: '挑戦 太郎',
    bornReality: '双方の懸念と目指すゴールが明確になり、これまでの行き詰まりが解消。\nプロジェクトの工程が再構築され、チーム全体の信頼関係と活気が生まれ、期日内に高品質な成果を達成できた。',
    mindName: '慈悲と智慧',
    bodhicittaText: '相手の真意と願いを深く受け止め、対立を超えて調和と新たな道を切り拓く力。\nどのようなカオスにも怯まず、魂の呼びかけとして応える力。',
    habitualTransmission: '自己防衛の反論や言い訳をしてしまい、壁を作って対話を閉ざしてしまう発信。',
    habitualReception: '相手の厳しい指摘に対し「責められた」「否定された」と被害的に受け止める受信の癖。',
    newTransmission: '自己防衛を捨て、率直な感謝と事実の共有、そして共に前進するための具体的代替案を温かい眼差しで発信する。',
    newReception: '厳しい言葉の奥にある「プロジェクトを絶対に成功させたい」という相手の真剣な願い（魂の願い）を受信する。',
    actionText: '1. 相手の指摘事項を丁寧に整理し、1対1の対話の場を設定する。\n2. まず相手の真意に耳を傾け、感謝を伝えた上で代替案を提示・相談する。',
    exerciseText: '朝の祈りと調心（呼吸を整える）。\n対話の前に「相手の神性を拝する」気持ちを心に想起する習慣を徹底する。',
    metChaos: '新規プロジェクトの納期直前に、クライアントおよび社内関係者から仕様変更と厳しい問題点の指摘が相次ぎ、チーム内に動揺と対立が生じた事態。スケジュール遅延の危機。'
  };

  // ---------------------------------------------------------------------------
  // データの保存と読み込み
  // ---------------------------------------------------------------------------

  // 現在の入力データをオブジェクトとして取得
  function getFormData() {
    const data = {};
    fieldIds.forEach(id => {
      if (fields[id]) {
        data[id] = fields[id].value;
      }
    });
    data.updatedAt = new Date().toISOString();
    return data;
  }

  // オブジェクトデータを各入力枠に反映（旧バージョンとの互換性も保持）
  function setFormData(data) {
    if (!data) return;

    // 旧フォーマットの移行対応
    if (!data.habitualTransmission && !data.habitualReception && data.habitualPattern) {
      data.habitualReception = data.habitualPattern;
    }
    if (!data.newTransmission && data.transmissionText) {
      data.newTransmission = data.transmissionText;
    }
    if (!data.newReception && data.receptionText) {
      data.newReception = data.receptionText;
    }

    fieldIds.forEach(id => {
      if (fields[id] && typeof data[id] === 'string') {
        fields[id].value = data[id];
      }
    });
  }

  // トースト表示
  let toastTimer = null;
  function showToast(message) {
    saveToast.textContent = message;
    saveToast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      saveToast.classList.remove('show');
    }, 2000);
  }

  // LocalStorageへの保存
  function saveToLocalStorage(notify = false) {
    try {
      const data = getFormData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (notify) {
        showToast('保存しました');
      }
    } catch (e) {
      console.error('保存に失敗しました:', e);
    }
  }

  // LocalStorageからの読み込み
  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setFormData(data);
      }
    } catch (e) {
      console.error('読み込みに失敗しました:', e);
    }
  }

  // 自動保存のデバウンス
  let autoSaveTimeout = null;
  function triggerAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveToLocalStorage(false);
    }, 600);
  }

  // 全入力項目に入力リスナーを設定
  fieldIds.forEach(id => {
    if (fields[id]) {
      fields[id].addEventListener('input', triggerAutoSave);
    }
  });

  // ---------------------------------------------------------------------------
  // ズーム・拡大縮小の制御
  // ---------------------------------------------------------------------------
  let currentZoom = 100;

  function applyZoom(zoomPercent) {
    currentZoom = Math.min(Math.max(zoomPercent, 40), 160);
    const scale = currentZoom / 100;
    sheetScaleWrapper.style.transform = `scale(${scale})`;
    zoomSlider.value = currentZoom;
    zoomVal.textContent = `${currentZoom}%`;
    
    // スケール時のコンテナ高さ調整
    const sheetHeight = 735;
    const scaledHeight = sheetHeight * scale;
    sheetScaleWrapper.parentElement.style.minHeight = `${scaledHeight + 48}px`;

    saveSettings();
  }

  // ウィンドウ幅に合わせた最適倍率の自動計算
  function fitToWindow() {
    const availableWidth = window.innerWidth - 60;
    const sheetWidth = 1040;
    let targetZoom = Math.floor((availableWidth / sheetWidth) * 100);
    targetZoom = Math.min(Math.max(targetZoom, 50), 120);
    applyZoom(targetZoom);
  }

  zoomSlider.addEventListener('input', (e) => {
    applyZoom(parseInt(e.target.value, 10));
  });

  zoomInBtn.addEventListener('click', () => {
    applyZoom(currentZoom + 10);
  });

  zoomOutBtn.addEventListener('click', () => {
    applyZoom(currentZoom - 10);
  });

  zoomFitBtn.addEventListener('click', fitToWindow);

  // ---------------------------------------------------------------------------
  // 背景図の濃淡スライダー制御
  // ---------------------------------------------------------------------------
  function applyBgOpacity(opacityVal) {
    const opacity = opacityVal / 100;
    diagramLayer.style.opacity = opacity;
    bgOpacitySlider.value = opacityVal;
    bgOpacityVal.textContent = `${opacityVal}%`;
    saveSettings();
  }

  bgOpacitySlider.addEventListener('input', (e) => {
    applyBgOpacity(parseInt(e.target.value, 10));
  });

  // ユーザー設定の保存・読み込み
  function saveSettings() {
    try {
      const settings = {
        zoom: currentZoom,
        opacity: bgOpacitySlider.value
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  function loadSettings() {
    try {
      const settingsStr = localStorage.getItem(SETTINGS_KEY);
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.zoom) applyZoom(settings.zoom);
        if (settings.opacity) applyBgOpacity(settings.opacity);
      } else {
        // 初期ロード時、画面幅が1120px未満なら自動フィット
        if (window.innerWidth < 1120) {
          fitToWindow();
        }
      }
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 各種ボタンアクション
  // ---------------------------------------------------------------------------

  // 手動保存ボタン
  saveLocalBtn.addEventListener('click', () => {
    saveToLocalStorage(true);
  });

  // サンプルデータ投入
  sampleBtn.addEventListener('click', () => {
    const current = getFormData();
    const hasData = Object.keys(current).some(k => k !== 'updatedAt' && current[k].trim() !== '');
    if (hasData) {
      if (!confirm('記入例を読み込むと現在の入力内容が上書きされます。よろしいですか？')) {
        return;
      }
    }
    setFormData(sampleData);
    saveToLocalStorage(false);
    showToast('記入例を読み込みました');
  });

  // クリア（初期化）
  clearBtn.addEventListener('click', () => {
    if (confirm('すべての枠の記入内容を消去してもよろしいですか？')) {
      fieldIds.forEach(id => {
        if (fields[id]) fields[id].value = '';
      });
      saveToLocalStorage(false);
      showToast('クリアしました');
    }
  });

  // ファイルエクスポート (JSON)
  exportJsonBtn.addEventListener('click', () => {
    const data = getFormData();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const userName = (data.userName || '未記入').replace(/[\\/:*?"<>|]/g, '');
    const filename = `菩提心チャレンジシート_${userName}_${y}${m}${d}.json`;

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('ファイルを保存しました');
  });

  // ファイルインポート (JSON)
  importJsonInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        setFormData(importedData);
        saveToLocalStorage(false);
        showToast('ファイルを正常に読み込みました');
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。正しいJSONファイルかご確認ください。');
      }
      importJsonInput.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  });

  // 印刷 / PDF出力
  printBtn.addEventListener('click', () => {
    window.print();
  });

  // ---------------------------------------------------------------------------
  // 初期化実行
  // ---------------------------------------------------------------------------
  loadFromLocalStorage();
  loadSettings();
});
