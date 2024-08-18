import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminJobManagement from './pages/AdminJobManagement';
import { AppProvider } from './contexts/AppContext';

const App = () => {
  // In a real app, you would determine if the user is an admin
  const isAdmin = true;

  return (
    <AppProvider>
      <Router>
        <Header isAdmin={isAdmin} />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/dashboard" component={UserDashboard} />
          {isAdmin && (
            <>
              <Route path="/admin" exact component={AdminDashboard} />
              <Route path="/admin/jobs" component={AdminJobManagement} />
            </>
          )}
        </Switch>
        <Footer />
      </Router>
    </AppProvider>
  );
};

export default App;