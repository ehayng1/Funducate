import {
  StyleSheet,
  Text,
  Image,
  View,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Dimensions, RefreshControl } from "react-native";
import { iconPath } from "../data/iconPath";
import React, { useState, useEffect } from "react";
import {
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import options from "../config";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
const screenWidth = Dimensions.get("window").width * 0.95;
export default function Leaderboard({ route, navigation }) {
  navigation.setOptions({ title: "Leaderboard" });
  const [refreshing, setRefreshing] = React.useState(false);
  const [userData, setUserData] = React.useState([{}]);
  const [stockData, setStockData] = React.useState({ AAPL: 222 });
  const [priceData, setPriceData] = React.useState([{}]);
  const [name, setName] = React.useState([]);
  const [balance, setBalance] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // const onRefresh = React.useCallback(async () => {
  //   setRefreshing(true);
  //   await getName();
  //   console.log("name: ", name);
  //   await getUserData();
  //   console.log("userData: ", userData);
  //   await fetchPrices();
  //   console.log("tempData: ", tempData);
  //   setIsLoading(false);
  //   console.log("Loading done!");
  //   setRefreshing(false);
  // }, []);
  let tempPriceData = [];

  let symbolStr = "";
  let tempUserData = [];
  let tempData = {};

  const getName = async () => {
    setIsLoading(true);
    console.log("loading starts!");
    let tempName = [];
    let tempBalance = [];
    const querySnapshot = await getDocs(collection(db, "users"));

    querySnapshot.forEach((doc) => {
      let name = doc.data().name;
      tempName.push(name);
      tempBalance.push(doc.data().balance);
    });
    setBalance(tempBalance);
    setName(tempName);
  };

  const getUserData = async () => {
    const querySnapshot = await getDocs(collection(db, "holdingStack"));

    querySnapshot.forEach((doc) => {
      let temp = Object.keys(doc.data());

      tempUserData.push(doc.data());
      // console.log("data: ", doc.data());

      for (let i = 0; i < temp.length; i++) {
        symbolStr = symbolStr + "%2C" + temp[i];
      }
    });
    console.log("userData: ", userData);
    setUserData(tempUserData);

    console.log("Big string: ", symbolStr);
  };

  const fetchPrices = async () => {
    symbolStr = symbolStr.slice(3);
    fetch(
      "https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes?region=US&symbols=" +
        symbolStr,
      options
    )
      .then((response) => response.json())
      .then((response) => {
        let data = response.quoteResponse.result;

        data.forEach((el) => {
          tempData[el.symbol] = el.regularMarketPrice;
        });
        setStockData(tempData);
      })
      .catch((err) => console.error("ERROR: ", err));
  };

  // calculates revenues for each user
  const calculateRevenue = async () => {
    console.log("cal: ", userData);
    for (let i = 0; i < userData.length; i++) {
      let profit = 0;
      let user = userData[i];
      let symbol;
      for (let j = 0; j < Object.keys(user).length; j++) {
        symbol = Object.keys(user)[j];
        profit = profit + user[symbol] * stockData[symbol]; // amount * symbol
      }
      tempPriceData.push({
        name: name[i],
        profit: (profit + balance[i]).toFixed(2),
      });
    }
    console.log(balance);
    // tempPriceData.sort((a, b) => b.profit - a.profit);
    setPriceData(tempPriceData);
  };

  // useEffect(() => {
  //   const init = async () => {
  //     await getName();
  //     console.log("name: ", name);
  //     await getUserData();
  //     console.log("userData: ", userData);
  //     await fetchPrices();
  //     console.log("tempData: ", tempData);
  //     setIsLoading(false);
  //     console.log("Loading done!");
  //   };
  //   init();
  // }, []);

  useEffect(() => {
    const init = async () => {
      await calculateRevenue();
    };
    init();
    console.log("priceData: ", priceData);
  }, [stockData]);
  // 56286
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      await getName();
      console.log("name: ", name);
      await getUserData();
      console.log("userData: ", userData);
      await fetchPrices();
      console.log("priceData: ", tempData);
      setIsLoading(false);
      console.log("Loading done!");
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView
    // refreshControl={
    //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    // }
    >
      {isLoading ? (
        <View style={{ marginTop: "60%" }}>
          <ActivityIndicator size="large" color="#D84315" />
          <Text style={{ textAlign: "center", fontSize: 16, marginTop: 10 }}>
            Reading data from server...
          </Text>
        </View>
      ) : (
        <>
          <View
            style={{
              backgroundColor: "#e8e2c2",
              height: hp("30%"),
              // heigth: 300,
              // borderBottomEndRadius: 30,
              // borderBottomLeftRadius: 30,
            }}
          >
            <View
              style={{
                marginHorizontal: "5%",
                flexDirection: "row",
                justifyContent: "space-around",
              }}
            >
              {/* {priceData.map( */}
              {priceData
                .sort((a, b) => b.profit - a.profit)
                .map(
                  (el, index) =>
                    priceData.length >= 3 &&
                    index < 3 && (
                      <View
                        key={new Date().getTime().toString()}
                        style={[
                          { marginTop: index === 1 ? 30 : 50 },
                          { marginBottom: index === 1 ? 25 : 5 },
                          // { paddingBottom: index === 1 ? 0 : 10 },
                          {
                            width: wp("25%"),
                            paddingHorizontal: wp("1%"),
                            flexDirection: "column",
                            paddingTop: 15,
                            paddingBottom: 10,
                            borderRadius: 20,
                            backgroundColor: "#ffbc76",
                          },
                        ]}
                      >
                        <Image
                          style={{ width: 100, height: 100, marginBottom: 5 }}
                          // source={require("../data/" + 1 + ".png")}
                          source={iconPath[index].src}
                        />
                        <View
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <Text
                            style={{
                              color: "#943210",
                              fontSize: 16,
                              fontWeight: "600",
                              textAlign: "center",
                            }}
                          >
                            {index === 0 && priceData[1].name}
                            {index === 1 && priceData[0].name}
                            {index === 2 && priceData[2].name}
                          </Text>
                        </View>
                        <Text
                          style={{
                            marginTop: 5,
                            color: "#540000",
                            fontSize: 12,
                            fontWeight: "400",
                            textAlign: "center",
                          }}
                        >
                          $ {index === 0 && priceData[1].profit}
                          {index === 1 && priceData[0].profit}
                          {index === 2 && priceData[2].profit}
                        </Text>
                      </View>
                    )
                )}
            </View>
          </View>
          <View style={{ marginTop: 45, marginHorizontal: "5%" }}>
            {/* {priceData.map( */}
            {priceData
              .sort((a, b) => b.profit - a.profit)
              .map(
                (el, index) =>
                  index > 2 && (
                    <View
                      key={new Date().getTime().toString()}
                      style={{
                        flexDirection: "column",
                      }}
                    >
                      <View
                        style={{
                          marginLeft: 20,
                          marginHorizontal: 10,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            width: wp("7.5%"),
                            // marginRight: wp("1%"),
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          {index + 1}
                        </Text>
                        <Text
                          style={{
                            // flexGrow: 1,
                            width: wp("55%"),
                            fontWeight: "500",
                            fontSize: 18,
                          }}
                        >
                          {el.name}
                        </Text>
                        <Text
                          style={{
                            marginRight: 10,
                            fontWeight: "500",
                            fontSize: 16,
                            color: "#5A5A5A",
                          }}
                        >
                          {/* ${el.profit} */}$ {el.profit}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 1,
                          marginBottom: 15,
                          marginTop: 15,
                          backgroundColor: "#808080",
                        }}
                      ></View>
                    </View>
                  )
              )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
