/* @flow weak */

import React from "react";

import { Route } from "metabase/hoc/Title";
import { Redirect, IndexRedirect, IndexRoute } from "react-router";
import { routerActions } from "react-router-redux";
import { UserAuthWrapper } from "redux-auth-wrapper";
import { t } from "c-3po";

import { loadCurrentUser } from "metabase/redux/user";
import MetabaseSettings from "metabase/lib/settings";

import App from "metabase/App.jsx";

import { withBackground } from "metabase/hoc/Background";

import HomepageApp from "metabase/home/containers/HomepageApp";

// auth containers
import ForgotPasswordApp from "metabase/auth/containers/ForgotPasswordApp.jsx";
import LoginApp from "metabase/auth/containers/LoginApp.jsx";
import LogoutApp from "metabase/auth/containers/LogoutApp.jsx";
import PasswordResetApp from "metabase/auth/containers/PasswordResetApp.jsx";
import GoogleNoAccount from "metabase/auth/components/GoogleNoAccount.jsx";

/* Dashboards */
import DashboardApp from "metabase/dashboard/containers/DashboardApp";
import AutomaticDashboardApp from "metabase/dashboard/containers/AutomaticDashboardApp";

import {
  BrowseApp,
  DatabaseBrowser,
  SchemaBrowser,
  TableBrowser,
  TableInfoApp,
  FieldInfoApp,
} from "metabase/components/BrowseApp";

import QueryBuilder from "metabase/query_builder/containers/QueryBuilder.jsx";

import CollectionEdit from "metabase/questions/containers/CollectionEdit.jsx";
import CollectionCreate from "metabase/questions/containers/CollectionCreate.jsx";
import CollectionPermissions from "metabase/admin/permissions/containers/CollectionsPermissionsApp.jsx";
import ArchiveCollectionModal from "metabase/components/ArchiveCollectionModal";

import PulseEditApp from "metabase/pulse/containers/PulseEditApp.jsx";
import PulseListApp from "metabase/pulse/containers/PulseListApp.jsx";
import PulseMoveModal from "metabase/pulse/components/PulseMoveModal";
import SetupApp from "metabase/setup/containers/SetupApp.jsx";
import PostSetupApp from "metabase/setup/containers/PostSetupApp.jsx";
import UserSettingsApp from "metabase/user/containers/UserSettingsApp.jsx";
import EntityPage from "metabase/components/EntityPage.jsx";
// new question
import {
  NewQuestionStart,
  NewQuestionMetricSearch,
} from "metabase/new_query/router_wrappers";

import NotFound from "metabase/components/NotFound.jsx";
import Unauthorized from "metabase/components/Unauthorized.jsx";

import getAdminRoutes from "metabase/admin/routes";

import PublicQuestion from "metabase/public/containers/PublicQuestion.jsx";
import PublicDashboard from "metabase/public/containers/PublicDashboard.jsx";
import { DashboardHistoryModal } from "metabase/dashboard/components/DashboardHistoryModal";
import DashboardMoveModal from "metabase/dashboard/components/DashboardMoveModal";
import { ModalRoute } from "metabase/hoc/ModalRoute";

import CollectionLanding from "metabase/components/CollectionLanding";
import Overworld from "metabase/containers/Overworld";

import ArchiveApp from "metabase/home/containers/ArchiveApp.jsx";
import SearchApp from "metabase/home/containers/SearchApp";

const MetabaseIsSetup = UserAuthWrapper({
  predicate: authData => !authData.hasSetupToken,
  failureRedirectPath: "/setup",
  authSelector: state => ({ hasSetupToken: MetabaseSettings.hasSetupToken() }), // HACK
  wrapperDisplayName: "MetabaseIsSetup",
  allowRedirectBack: false,
  redirectAction: routerActions.replace,
});

const UserIsAuthenticated = UserAuthWrapper({
  failureRedirectPath: "/auth/login",
  authSelector: state => state.currentUser,
  wrapperDisplayName: "UserIsAuthenticated",
  redirectAction: location =>
    // HACK: workaround for redux-auth-wrapper not including hash
    // https://github.com/mjrussell/redux-auth-wrapper/issues/121
    routerActions.replace({
      ...location,
      query: {
        ...location.query,
        redirect: location.query.redirect + (window.location.hash || ""),
      },
    }),
});

const UserIsAdmin = UserAuthWrapper({
  predicate: currentUser => currentUser && currentUser.is_superuser,
  failureRedirectPath: "/unauthorized",
  authSelector: state => state.currentUser,
  allowRedirectBack: false,
  wrapperDisplayName: "UserIsAdmin",
  redirectAction: routerActions.replace,
});

const UserIsNotAuthenticated = UserAuthWrapper({
  predicate: currentUser => !currentUser,
  failureRedirectPath: "/",
  authSelector: state => state.currentUser,
  allowRedirectBack: false,
  wrapperDisplayName: "UserIsNotAuthenticated",
  redirectAction: routerActions.replace,
});

const IsAuthenticated = MetabaseIsSetup(
  UserIsAuthenticated(({ children }) => children),
);
const IsAdmin = withBackground("bg-white")(
  MetabaseIsSetup(UserIsAuthenticated(UserIsAdmin(({ children }) => children))),
);
const IsNotAuthenticated = MetabaseIsSetup(
  UserIsNotAuthenticated(({ children }) => children),
);

export const getRoutes = store => (
  <Route title="Metabase" component={App}>
    {/* SETUP */}
    <Route
      path="/setup"
      component={SetupApp}
      onEnter={(nextState, replace) => {
        if (!MetabaseSettings.hasSetupToken()) {
          replace("/");
        }
      }}
    />

    {/* PUBLICLY SHARED LINKS */}
    <Route path="public">
      <Route path="question/:uuid" component={PublicQuestion} />
      <Route path="dashboard/:uuid" component={PublicDashboard} />
    </Route>

    {/* APP */}
    <Route
      onEnter={async (nextState, replace, done) => {
        await store.dispatch(loadCurrentUser());
        done();
      }}
    >
      {/* AUTH */}
      <Route path="/auth">
        <IndexRedirect to="/auth/login" />
        <Route component={IsNotAuthenticated}>
          <Route path="login" title={t`Login`} component={LoginApp} />
        </Route>
        <Route path="logout" component={LogoutApp} />
        <Route path="forgot_password" component={ForgotPasswordApp} />
        <Route path="reset_password/:token" component={PasswordResetApp} />
        <Route path="google_no_mb_account" component={GoogleNoAccount} />
      </Route>

      {/* MAIN */}
      <Route component={IsAuthenticated}>
        {/* The global all hands rotues, things in here are for all the folks */}
        <Route path="/" component={Overworld} />

        <Route path="/explore" component={PostSetupApp} />
        <Route path="/explore/:databaseId" component={PostSetupApp} />

        <Route path="search" title={t`Search`} component={SearchApp} />
        <Route path="archive" title={t`Archive`} component={ArchiveApp} />

        <Route path="collection/:collectionId" component={CollectionLanding}>
          <ModalRoute path="archive" modal={ArchiveCollectionModal} />
        </Route>

        <Route path="activity" component={HomepageApp} />

        <Route
          path="dashboard/:dashboardId"
          title={t`Dashboard`}
          component={DashboardApp}
        >
          <ModalRoute path="history" modal={DashboardHistoryModal} />
          <ModalRoute path="move" modal={DashboardMoveModal} />
        </Route>

        <Route path="/question">
          <IndexRoute component={QueryBuilder} />
          {/* NEW QUESTION FLOW */}
          <Route path="new" title={t`New Question`}>
            <IndexRoute component={NewQuestionStart} />
            <Route
              path="metric"
              title={t`Metrics`}
              component={NewQuestionMetricSearch}
            />
          </Route>
        </Route>
        <Route path="/question/:cardId" component={QueryBuilder} />
        <Route path="/question/:cardId/entity" component={EntityPage} />

        <Route path="/ready" component={PostSetupApp} />

        <Route path="browse" component={BrowseApp}>
          <IndexRoute component={DatabaseBrowser} />
          <Route path=":dbId" component={SchemaBrowser} />
          <Route path=":dbId/schema/:schemaName" component={TableBrowser} />
          <Route path=":dbId/table/:tableId/info" component={TableInfoApp} />
          <Route
            path=":dbId/table/:tableId/field/:fieldId/info"
            component={FieldInfoApp}
          />
        </Route>

        {/* INDIVIDUAL DASHBOARDS */}

        <Route path="/auto/dashboard/*" component={AutomaticDashboardApp} />
      </Route>

      <Route path="/collections">
        <Route path="create" component={CollectionCreate} />
        <Route path="permissions" component={CollectionPermissions} />
        <Route path=":collectionId" component={CollectionEdit} />
      </Route>

      {/* PULSE */}
      <Route path="/pulse" title={t`Pulses`}>
        <IndexRoute component={PulseListApp} />
        <Route path="create" component={PulseEditApp} />
        <Route path=":pulseId">
          <IndexRoute component={PulseEditApp} />
          <ModalRoute path="move" modal={PulseMoveModal} />
        </Route>
      </Route>

      {/* USER */}
      <Route path="/user/edit_current" component={UserSettingsApp} />

      {/* ADMIN */}
      {getAdminRoutes(store, IsAdmin)}
    </Route>

    {/* INTERNAL */}
    <Route
      path="/_internal"
      getChildRoutes={(partialNextState, callback) =>
        // $FlowFixMe: flow doesn't know about require.ensure
        require.ensure([], require => {
          callback(null, [require("metabase/internal/routes").default]);
        })
      }
    />

    {/* DEPRECATED */}
    {/* NOTE: these custom routes are needed because <Redirect> doesn't preserve the hash */}
    <Route
      path="/q"
      onEnter={({ location }, replace) =>
        replace({ pathname: "/question", hash: location.hash })
      }
    />
    <Route
      path="/card/:cardId"
      onEnter={({ location, params }, replace) =>
        replace({
          pathname: `/question/${params.cardId}`,
          hash: location.hash,
        })
      }
    />
    <Redirect from="/dash/:dashboardId" to="/dashboard/:dashboardId" />

    {/* MISC */}
    <Route path="/unauthorized" component={Unauthorized} />
    <Route path="/*" component={NotFound} />
  </Route>
);
