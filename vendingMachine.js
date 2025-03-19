/**
 * 自動販売機クラス
 */
class VendingMachine {
  /**
   * コンストラクタ
   * @param {Object} drinks - 飲料の初期設定 { name: { price: 数値, stock: 数値 } }
   * @param {Object} change - 釣り銭の初期設定 { 金額: 枚数 }
   */
  constructor(drinks = {}, change = {}) {
    this.drinks = drinks;
    this.change = change;
    this.insertedAmount = 0;
    this.timeoutId = null;
    this.autoReturnTime = 30000; // 30秒後に自動返却
  }

  /**
   * お金を投入する
   * @param {number} amount - 投入金額
   * @returns {number} - 現在の投入金額合計
   */
  insertMoney(amount) {
    if (amount <= 0) {
      throw new Error('正の金額を投入してください');
    }
    
    // 硬貨のみ受け付ける（10円, 50円, 100円, 500円）
    const validCoins = [10, 50, 100, 500];
    if (!validCoins.includes(amount)) {
      throw new Error('硬貨のみ対応しています');
    }
    
    this.insertedAmount += amount;
    
    // 自動返却タイマーをリセット
    this.resetAutoReturnTimer();
    
    return this.insertedAmount;
  }

  /**
   * 自動返却タイマーをリセットする
   */
  resetAutoReturnTimer() {
    // 既存のタイマーをクリア
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    // 新しいタイマーを設定
    this.timeoutId = setTimeout(() => {
      this.returnMoney();
    }, this.autoReturnTime);
  }

  /**
   * 投入金額を返却する
   * @returns {number} - 返却された金額
   */
  returnMoney() {
    const returnedAmount = this.insertedAmount;
    this.insertedAmount = 0;
    // 釣り銭から必要な金額を減らす
    this.reduceChange(changeAmount);
    // タイマーをクリア
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    return returnedAmount;
  }

  /**
   * 商品を購入する
   * @param {string} drinkName - 購入する飲料の名前
   * @returns {Object} - 購入結果 { success: boolean, message: string, change: number, drink: string }
   */
  purchase(drinkName) {
    // 商品が存在するか確認
    if (!this.drinks[drinkName]) {
      return {
        success: false,
        message: '指定された商品は存在しません',
        change: this.returnMoney(),
        drink: null
      };
    }

    const drink = this.drinks[drinkName];
    
    // 在庫があるか確認
    if (drink.stock <= 0) {
      return {
        success: false,
        message: '商品は売り切れです',
        change: this.returnMoney(),
        drink: null
      };
    }
    
    // 投入金額が足りるか確認
    if (this.insertedAmount < drink.price) {
      return {
        success: false,
        message: '投入金額が不足しています',
        change: 0, // 返却せず、追加投入を待つ
        drink: null
      };
    }
    
    // 釣り銭の計算
    const changeAmount = this.insertedAmount - drink.price;
    
    // 釣り銭が出せるか確認
    if (!this.canProvideChange(changeAmount)) {
      return {
        success: false,
        message: '釣り銭が不足しています',
        change: this.returnMoney(),
        drink: null
      };
    }
    
    // 購入処理
    drink.stock--;
    this.insertedAmount = 0;
    
    // タイマーをクリア
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    // 釣り銭から必要な金額を減らす
    this.reduceChange(changeAmount);
    
    return {
      success: true,
      message: '購入が完了しました',
      change: changeAmount,
      drink: drinkName
    };
  }

  /**
   * 釣り銭が出せるか確認する
   * @param {number} amount - 必要な釣り銭の金額
   * @returns {boolean} - 釣り銭が出せるかどうか
   */
  canProvideChange(amount) {
    if (amount === 0) return true;
    
    // 釣り銭の合計金額を計算
    let totalChange = 0;
    for (const [denomination, count] of Object.entries(this.change)) {
      totalChange += parseInt(denomination) * count;
    }
    
    // 単純に合計金額で判断（実際には硬貨の組み合わせも考慮する必要がある）
    return totalChange >= amount;
  }

  /**
   * 釣り銭から必要な金額を減らす
   * @param {number} amount - 減らす金額
   */
  reduceChange(amount) {
    // 実際の実装では、硬貨の組み合わせを考慮して減らす必要がある
    // ここでは簡略化のため、合計金額から減らすだけとする
    let remainingAmount = amount;
    
    // 大きい金額から使用していく
    const denominations = Object.keys(this.change)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const denomination of denominations) {
      while (remainingAmount >= denomination && this.change[denomination] > 0) {
        remainingAmount -= denomination;
        this.change[denomination]--;
      }
      
      if (remainingAmount === 0) break;
    }
  }

  /**
   * 在庫を補充する
   * @param {string} drinkName - 飲料の名前
   * @param {number} quantity - 補充する数量
   */
  restock(drinkName, quantity) {
    if (!this.drinks[drinkName]) {
      throw new Error('指定された商品は存在しません');
    }
    
    if (quantity <= 0) {
      throw new Error('正の数量を指定してください');
    }
    
    this.drinks[drinkName].stock += quantity;
  }

  /**
   * 釣り銭を補充する
   * @param {number} denomination - 金額
   * @param {number} quantity - 補充する枚数
   */
  addChange(denomination, quantity) {
    if (quantity <= 0) {
      throw new Error('正の数量を指定してください');
    }
    
    if (!this.change[denomination]) {
      this.change[denomination] = 0;
    }
    
    this.change[denomination] += quantity;
  }

  /**
   * 商品情報を取得する
   * @returns {Object} - 商品情報
   */
  getDrinks() {
    return { ...this.drinks };
  }

  /**
   * 現在の投入金額を取得する
   * @returns {number} - 現在の投入金額
   */
  getInsertedAmount() {
    return this.insertedAmount;
  }

  /**
   * 釣り銭情報を取得する
   * @returns {Object} - 釣り銭情報
   */
  getChange() {
    return { ...this.change };
  }
}

module.exports = VendingMachine;
