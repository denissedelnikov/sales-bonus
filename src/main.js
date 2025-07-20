/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции
    const { sale_price, quantity } = purchase;
    const discount = (1 - (purchase.discount / 100))
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
    } else if ((total - 1)  == index) {
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
        seller.sales_count = (seller.sales_count || 0) + 1;
        // Увеличить общую сумму всех продаж
        seller.revenue = (seller.revenue || 0) + record.total_amount
        
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            
            // Учёт количества проданных товаров  
            if (!seller.products_sold) {
                seller.products_sold = {}
            }  
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0
            } 

            seller.products_sold[item.sku] += item.quantity
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            product['cost'] = product.purchase_price * item.quantity
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevesnue
            product['revenue'] = calculateRevenue(item)
            // Посчитать прибыль: выручка минус себестоимость
            seller.profit = (seller.profit || 0)   + (product['revenue'] - product['cost'])
        });

        // Сортируем продавцов по прибыли
        sellerStats.sort((a,b) => (
            (b = b.profit) - (a =  a.profit)
        ))

    });

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, 5 ,seller)  // Считаем бонус
        seller.top_products = 
        Object.entries(seller.products_sold)  // Формируем топ-10 товаров
        .map(([sku, quantity]) => ({
            sku,
            quantity
        }))
        .sort((a,b) => (
            (b = b.quantity) - (a =  a.quantity) 
        ))
        .slice(0,10)
    })

    return sellerStats.map(seller => ({
        seller_id: seller.id, // Строка, идентификатор продавца
        name: `${seller.first_name} ${seller.last_name}` , // Строка, имя продавца
        revenue: +(seller.revenue).toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: +(seller.profit).toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: [...seller.top_products],// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +(seller.bonus).toFixed(2)// Число с двумя знаками после точки, бонус продавца
        }));
}

