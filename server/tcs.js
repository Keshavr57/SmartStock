import YahooFinance from "yahoo-finance2";

const yahoo = new YahooFinance();

const test = async () => {
  const data = await yahoo.quoteSummary("TCS.NS", {
    modules: [
      "price",
      "summaryDetail",
      "financialData",
      "defaultKeyStatistics"
    ]
  });

  console.log(JSON.stringify(data, null, 2));
};

test();
