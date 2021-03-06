const axios = require('axios');

const { Pool } = require('pg');

const bitbnsApi = require('bitbns');

const bitbns = new bitbnsApi({
  apiKey: '',
  apiSecretKey: '',
});

/*
create table xrpinr(
    id serial,
    timestamp varchar(255) primary key,
    maindata jsonb,
)
*/

const getDB = async () => {
  return new Pool({
    connectionString: 'postgres://postgres:endencre@localhost:5432/postgres',
  });
};

const readData = async () => {
  try {
    const db = await getDB();
    await db.connect();
    const { rows } = await db.query(
      'SELECT * FROM xrpinr ORDER BY id DESC LIMIT 1'
    );
    db.end();
    return rows[0];
  } catch (error) {
    console.log(error);
    return {
      message: error,
    };
  }
};

const writeData = async (...args) => {
  try {
    const db = await getDB();
    await db.connect();
    const { rows } = await db.query(
      'insert into xrpinr(timestamp,maindata) values($1,$2)',
      args
    );
    console.log('insterting into db');
    db.end();
    return rows;
  } catch (error) {
    console.error(error);
    return error;
  }
};

const getWazirxData = async () => {
  const wazir = await axios.get('https://api.wazirx.com/api/v2/tickers');
  return {
    platform: 'WazirX',
    last: wazir.data.xrpinr.last.toString(),
    buy: wazir.data.xrpinr.buy.toString(),
    sell: wazir.data.xrpinr.sell.toString(),
  };
};

const getCoindcxData = async () => {
  const coindcx = await axios.get('https://public.coindcx.com/exchange/ticker');
  const coindcxData = coindcx.data[351];

  return {
    platform: 'CoinDCX',
    last: coindcxData.last_price.toString(),
    buy: coindcxData.bid.toString(),
    sell: coindcxData.ask.toString(),
  };
};

const getBitbns = async () => {
  return new Promise((resolve, reject) => {
    bitbns.getTickerApi('XRP', (err, res) => {
      if (err) {
        reject('Error in bitbns');
      }
      resolve({
        platform: 'Bitbns',
        last: res.data.XRP.last_traded_price.toString(),
        buy: res.data.XRP.highest_buy_bid.toString(),
        sell: res.data.XRP.lowest_sell_bid.toString(),
      });
    });
  });
};

const getColodaxData = async () => {
  const colodax = await axios.get('https://colodax.com/api/ticker');
  const XRPInr = colodax.data.XRP_INR;
  return {
    platform: 'Colodax',
    last: XRPInr.last_price.toString(),
    buy: XRPInr.highestBid.toString(),
    sell: XRPInr.lowestAsk.toString(),
  };
};

const getGiottusData = async () => {
  const giottus = await axios.get('https://www.giottus.com/api/v2/ticker');
  return {
    platform: 'Giottus',
    last: giottus.data.xrpinr.last.toString(),
    buy: giottus.data.xrpinr.buy.toString(),
    sell: giottus.data.xrpinr.sell.toString(),
  };
};

const getZebpayData = async () => {
  const zebpay = await axios.get(
    'https://www.zebapi.com/pro/v1/market/XRP-INR/ticker'
  );
  return {
    platform: 'Zebpay',
    last: zebpay.data.market.toString(),
    buy: zebpay.data.buy.toString(),
    sell: zebpay.data.sell.toString(),
  };
};

const fetchXRP = async (time = new Date().getTime()) => {
  let data;
  try {
    data = await Promise.all([
      getBitbns(),
      getWazirxData(),
      getGiottusData(),
      getColodaxData(),
      getZebpayData(),
      getCoindcxData(),
    ]);
  } catch (error) {
    return console.log(error);
  }

  let avg = 0;
  for (i in data) {
    avg = avg + parseFloat(data[i].last);
  }
  avg /= data.length;

  for (i in data) {
    data[i].difference = (((avg - data[i].last) / avg) * 100).toString();
  }

  for (i in data) {
    data[i].savings = (avg - data[i].last).toString();
  }

  console.table(data);
  //   await writeData(time, JSON.stringify(data));
};

fetchXRP();

setInterval(() => {
  fetchXRP();
}, 60000);
