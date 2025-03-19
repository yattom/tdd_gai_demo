/**
 * 自動販売機の使用例
 */
const VendingMachine = require('./vendingMachine');

// 自動販売機の初期化
const vendingMachine = new VendingMachine(
  {
    'コーラ': { price: 120, stock: 10 },
    'お茶': { price: 150, stock: 5 },
    'コーヒー': { price: 180, stock: 3 },
    '水': { price: 100, stock: 7 }
  },
  {
    10: 20,   // 10円玉が20枚
    50: 10,   // 50円玉が10枚
    100: 5,   // 100円玉が5枚
    500: 2    // 500円玉が2枚
  }
);

// 使用例を実行する関数
function runExample() {
  console.log('===== 自動販売機シミュレーション =====');
  
  // 商品情報の表示
  console.log('\n【商品情報】');
  const drinks = vendingMachine.getDrinks();
  Object.entries(drinks).forEach(([name, info]) => {
    console.log(`${name}: ${info.price}円 (在庫: ${info.stock}個)`);
  });
  
  // お金を投入
  console.log('\n【お金投入】');
  console.log('100円投入: 合計', vendingMachine.insertMoney(100), '円');
  console.log('50円投入: 合計', vendingMachine.insertMoney(50), '円');
  console.log('現在の投入金額:', vendingMachine.getInsertedAmount(), '円');
  
  // 商品購入（投入金額不足）
  console.log('\n【商品購入 - 投入金額不足】');
  const result1 = vendingMachine.purchase('コーヒー');
  console.log('コーヒー購入結果:', result1);
  console.log('現在の投入金額:', vendingMachine.getInsertedAmount(), '円');
  
  // 追加投入
  console.log('\n【追加投入】');
  console.log('100円追加投入: 合計', vendingMachine.insertMoney(100), '円');
  
  // 商品購入（成功）
  console.log('\n【商品購入 - 成功】');
  const result2 = vendingMachine.purchase('コーヒー');
  console.log('コーヒー購入結果:', result2);
  console.log('現在の投入金額:', vendingMachine.getInsertedAmount(), '円');
  
  // 在庫確認
  console.log('\n【在庫確認】');
  const updatedDrinks = vendingMachine.getDrinks();
  console.log('コーヒー在庫:', updatedDrinks['コーヒー'].stock, '個');
  
  // 在庫補充
  console.log('\n【在庫補充】');
  vendingMachine.restock('コーヒー', 2);
  console.log('コーヒー在庫:', vendingMachine.getDrinks()['コーヒー'].stock, '個');
  
  // 売り切れ商品の作成
  console.log('\n【売り切れ商品の購入】');
  // コーヒーの在庫を0にする
  while (vendingMachine.getDrinks()['コーヒー'].stock > 0) {
    vendingMachine.insertMoney(200);
    vendingMachine.purchase('コーヒー');
  }
  console.log('コーヒー在庫:', vendingMachine.getDrinks()['コーヒー'].stock, '個');
  
  // 売り切れ商品の購入
  vendingMachine.insertMoney(200);
  const result3 = vendingMachine.purchase('コーヒー');
  console.log('売り切れコーヒー購入結果:', result3);
  
  // お金の返却
  console.log('\n【お金の返却】');
  console.log('100円投入: 合計', vendingMachine.insertMoney(100), '円');
  console.log('返却金額:', vendingMachine.returnMoney(), '円');
  console.log('現在の投入金額:', vendingMachine.getInsertedAmount(), '円');
  
  console.log('\n===== シミュレーション終了 =====');
}

// 例を実行
runExample();
