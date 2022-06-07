import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Intro } from "./components/nft/Intro";
import { Unseal } from "./components/dashboard/Unseal";
import { Write } from "./components/dashboard/Write";
import { User } from "./components/dashboard/User";
import { Home } from "./components/home/Home";
import { Subscribe } from "./components/dashboard/Subscribe";

export default function MyRouter() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path="/user">
          <User />
        </Route>
        <Route path="/write">
          <Write />
        </Route>
        <Route path="/unseal">
          <Unseal />
        </Route>
        <Route path="/subscribe">
          <Subscribe />
        </Route>
        <Route path="/nft">
          <Intro />
        </Route>
        <Route path="/">
          <Home />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}
