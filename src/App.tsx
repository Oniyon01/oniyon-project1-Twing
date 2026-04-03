import Feed from './components/Feed';
import './styles.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <img src="/wingy.png" alt="Wingy" className="header-wingy" />
        <div className="header-brand">
          <span className="logo">Twing</span>
          <span className="slogan">트렌드를 날개로 ✦</span>
        </div>
      </header>
      <Feed />
    </div>
  );
}
