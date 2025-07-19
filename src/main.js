/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции
    const { sale_price, quantity } = purchase;
    const discount = 1 - (purchase.discount / 100)
   return sale_price * quantity * discount
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if (index  == 0) {
        return (profit * 15) / 100
    } else if (index == 1 || index == 2) {
        return (profit * 10) / 100
    } else if (index ==  total -1) {
        return 0;
    } else { // Для всех остальных
        return (profit * 5) / 100
    } 
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if(!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Некорректные входные данные')
    }

    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;

    if ( !calculateRevenue || !calculateBonus) {
        throw new Error('Чего-то не хватает')
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({...seller}));

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((result, item) => ({
        ...result,
        [item.id]: item
    }), {});

    const productIndex = data.products.reduce((result, item) => ({
        ...result,
        [item.sku]: item
    }), {});


    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж 
        seller.sales_count  = (seller.sales_count ?? 0) + 1;
        // Увеличить общую сумму всех продаж
        seller.revenue = (seller.revenue ?? 0) + record.total_amount
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
             const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            let cost = product.purchase_price * item.quantity
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            let revenue  = calculateSimpleRevenue(item)
            // Посчитать прибыль: выручка минус себестоимость
            let profit = revenue - cost
             // Увеличить общую накопленную прибыль (profit) у продавца  
            seller.profit = (seller.profit ?? 0) + profit
            // Учёт количества проданных товаров 
            if (!seller.products_sold) {
                seller.products_sold = {};
            }
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }

            
            // Увеличить число всех проданных товарову продавца на количество проданных товаров в конкретном чеке
            
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity
        });
    });
    
    // @TODO: Сортировка продавцов по прибыли
   sellerStats.sort((a,b) =>  {
        return b.profit - a.profit
    })
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller)
        seller.top_products = Object.entries(seller.products_sold).map((item) => [{'sku':item[0],"quantity":item[1]}]).sort(([a],[b]) => {
           return  b["quantity"] - a["quantity"]
        }).slice(0,10)
    })

    // @TODO: Подготовка итоговой коллекции с нужными полями
        return sellerStats.map(seller => ({
                seller_id: seller.id,  // Строка, идентификатор продавца
                name: `${seller.first_name} ${seller.last_name}`, // Строка, имя продавца
                revenue: +(seller.revenue).toFixed(2),// Число с двумя знаками после точки, выручка продавца
                profit: +(seller.profit).toFixed(2), // Число с двумя знаками после точки, прибыль продавца
                sales_count: seller.sales_count,// Целое число, количество продаж продавца
                top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
                bonus: +(seller.bonus).toFixed(2)// Число с двумя знаками после точки, бонус продавца
        }))
}