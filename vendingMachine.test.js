const VendingMachine = require('./vendingMachine');

// タイマーのモック化
jest.useFakeTimers();

// グローバル関数のスパイ設定
let setTimeoutSpy;
let clearTimeoutSpy;

beforeEach(() => {
  // 各テスト前にスパイをリセット
  setTimeoutSpy = jest.spyOn(global, 'setTimeout');
  clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
});

afterEach(() => {
  // 各テスト後にスパイをリストア
  setTimeoutSpy.mockRestore();
  clearTimeoutSpy.mockRestore();
});

describe('VendingMachine', () => {
  let vendingMachine;
  
  beforeEach(() => {
    // 各テスト前に自動販売機を初期化
    vendingMachine = new VendingMachine(
      {
        'コーラ': { price: 120, stock: 5 },
        'お茶': { price: 150, stock: 3 },
        '水': { price: 100, stock: 0 } // 売り切れ
      },
      {
        10: 10,  // 10円玉が10枚
        50: 5,   // 50円玉が5枚
        100: 3,  // 100円玉が3枚
        500: 1   // 500円玉が1枚
      }
    );
  });

  describe('初期化', () => {
    test('正しく初期化されること', () => {
      expect(vendingMachine.getDrinks()).toEqual({
        'コーラ': { price: 120, stock: 5 },
        'お茶': { price: 150, stock: 3 },
        '水': { price: 100, stock: 0 }
      });
      
      expect(vendingMachine.getChange()).toEqual({
        10: 10,
        50: 5,
        100: 3,
        500: 1
      });
      
      expect(vendingMachine.getInsertedAmount()).toBe(0);
    });
  });

  describe('お金投入', () => {
    test('お金を投入すると投入金額が増えること', () => {
      expect(vendingMachine.insertMoney(100)).toBe(100);
      expect(vendingMachine.insertMoney(50)).toBe(150);
      expect(vendingMachine.getInsertedAmount()).toBe(150);
    });
    
    test('負の金額を投入するとエラーになること', () => {
      expect(() => vendingMachine.insertMoney(-100)).toThrow('正の金額を投入してください');
    });
    
    test('お金を投入すると自動返却タイマーがリセットされること', () => {
      vendingMachine.insertMoney(100);
      
      // タイマーが設定されていることを確認
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 30000);
      
      // 追加投入
      vendingMachine.insertMoney(50);
      
      // タイマーがリセットされていることを確認
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('お金返却', () => {
    test('投入金額が返却されること', () => {
      vendingMachine.insertMoney(100);
      vendingMachine.insertMoney(50);
      
      expect(vendingMachine.returnMoney()).toBe(150);
      expect(vendingMachine.getInsertedAmount()).toBe(0);
    });
    
    test('返却後にタイマーがクリアされること', () => {
      vendingMachine.insertMoney(100);
      
      // タイマーが設定されていることを確認
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      
      vendingMachine.returnMoney();
      
      // タイマーがクリアされていることを確認
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });
    
    test('一定時間後に自動的に返却されること', () => {
      vendingMachine.insertMoney(100);
      
      // 自動返却前の状態を確認
      expect(vendingMachine.getInsertedAmount()).toBe(100);
      
      // 時間を進める
      jest.runAllTimers();
      
      // 自動返却後の状態を確認
      expect(vendingMachine.getInsertedAmount()).toBe(0);
    });
  });

  describe('商品購入', () => {
    test('正常に購入できること', () => {
      vendingMachine.insertMoney(200);
      
      const result = vendingMachine.purchase('コーラ');
      
      expect(result).toEqual({
        success: true,
        message: '購入が完了しました',
        change: 80,
        drink: 'コーラ'
      });
      
      // 在庫が減っていることを確認
      expect(vendingMachine.getDrinks()['コーラ'].stock).toBe(4);
      
      // 投入金額がリセットされていることを確認
      expect(vendingMachine.getInsertedAmount()).toBe(0);
    });

    test('存在しない商品を選択するとエラーになること', () => {
      vendingMachine.insertMoney(200);
      
      const result = vendingMachine.purchase('ジュース');
      
      expect(result).toEqual({
        success: false,
        message: '指定された商品は存在しません',
        change: 200,
        drink: null
      });
      
      // 投入金額が返却されていることを確認
      expect(vendingMachine.getInsertedAmount()).toBe(0);
    });
    
    test('売り切れの商品を選択するとエラーになること', () => {
      vendingMachine.insertMoney(200);
      
      const result = vendingMachine.purchase('水');
      
      expect(result).toEqual({
        success: false,
        message: '商品は売り切れです',
        change: 200,
        drink: null
      });
      
      // 投入金額が返却されていることを確認
      expect(vendingMachine.getInsertedAmount()).toBe(0);
    });
    
    test('投入金額が不足している場合はエラーになること', () => {
      vendingMachine.insertMoney(100);
      
      const result = vendingMachine.purchase('コーラ');
      
      expect(result).toEqual({
        success: false,
        message: '投入金額が不足しています',
        change: 0,
        drink: null
      });
      
      // 投入金額が維持されていることを確認（追加投入を待つ）
      expect(vendingMachine.getInsertedAmount()).toBe(100);
    });
    
    test('釣り銭が不足している場合はエラーになること', () => {
      // 釣り銭が不足する状況を作る
      vendingMachine = new VendingMachine(
        { 'コーラ': { price: 120, stock: 5 } },
        {} // 釣り銭なし
      );
      
      vendingMachine.insertMoney(500);
      
      const result = vendingMachine.purchase('コーラ');
      
      expect(result).toEqual({
        success: false,
        message: '釣り銭が不足しています',
        change: 500,
        drink: null
      });
      
      // 投入金額が返却されていることを確認
      expect(vendingMachine.getInsertedAmount()).toBe(0);
    });
  });

  describe('在庫管理', () => {
    test('在庫を補充できること', () => {
      vendingMachine.restock('水', 3);
      
      expect(vendingMachine.getDrinks()['水'].stock).toBe(3);
    });
    
    test('存在しない商品を補充しようとするとエラーになること', () => {
      expect(() => vendingMachine.restock('ジュース', 3)).toThrow('指定された商品は存在しません');
    });
    
    test('負の数量を補充しようとするとエラーになること', () => {
      expect(() => vendingMachine.restock('コーラ', -1)).toThrow('正の数量を指定してください');
    });
  });

  describe('釣り銭管理', () => {
    test('釣り銭を補充できること', () => {
      vendingMachine.addChange(100, 5);
      
      expect(vendingMachine.getChange()[100]).toBe(8); // 元々3枚 + 5枚
    });
    
    test('新しい金種の釣り銭を追加できること', () => {
      vendingMachine.addChange(1000, 2);
      
      expect(vendingMachine.getChange()[1000]).toBe(2);
    });
    
    test('負の数量を補充しようとするとエラーになること', () => {
      expect(() => vendingMachine.addChange(100, -1)).toThrow('正の数量を指定してください');
    });
  });

  describe('釣り銭計算', () => {
    test('釣り銭が正しく計算されること', () => {
      vendingMachine.insertMoney(500);
      
      const result = vendingMachine.purchase('コーラ');
      
      expect(result.change).toBe(380);
    });
    
    test('釣り銭が正しく減算されること', () => {
      const originalChange = { ...vendingMachine.getChange() };
      
      vendingMachine.insertMoney(500);
      vendingMachine.purchase('コーラ');
      
      const newChange = vendingMachine.getChange();
      
      // 釣り銭が減っていることを確認（詳細な計算は実装による）
      expect(
        Object.entries(newChange).reduce((sum, [denom, count]) => sum + (Number(denom) * count), 0)
      ).toBeLessThan(
        Object.entries(originalChange).reduce((sum, [denom, count]) => sum + (Number(denom) * count), 0)
      );
    });
  });
});
