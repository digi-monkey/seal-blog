import React, { useState } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Intro } from "./components/nft/Intro";
import { Unseal } from "./components/dashboard/Unseal";
import { Write } from "./components/dashboard/Write";
import { User } from "./components/dashboard/User";
import { Home } from "./components/home/Home";
import { Subscribe } from "./components/dashboard/Subscribe";
import { Post } from "./components/dashboard/Post";
import { HexNum } from "@seal-blog/sdk";
import { AppContext, Context } from "./hooks/useContext";
import { LocalStore } from "./localStore";
import { NaiveMail } from "./components/dashboard/NaiveMail/NaiveMail";
import { DeployContracts } from "./components/dashboard/NaiveMail/Deploy";

export default function MyRouter() {
  const storeChainId = LocalStore.selectChainId();
  const [selectChainId, setSelectChainId] = useState<HexNum>();

  const appContext: AppContext = {
    network: {
      selectChainId: selectChainId || storeChainId,
      setSelectChainId,
    },
  };

  return (
    <BrowserRouter>
      <Context.Provider value={appContext}>
        <Switch>
          <Route path="/msg">
            <NaiveMail />
          </Route>
          <Route path="/deploy">
            <DeployContracts />
          </Route>
          <Route path="/user">
            <User />
          </Route>
          <Route path="/write">
            <Write />
          </Route>
          <Route path="/unseal">
            <Unseal />
          </Route>
          <Route path="/post">
            <Post />
          </Route>
          <Route path="/subscribe">
            <Subscribe />
          </Route>
          <Route path="/nft">
            <Intro />
          </Route>
          <Route path="/404">
            <h1>404 not found</h1>
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </Context.Provider>
    </BrowserRouter>
  );
}
