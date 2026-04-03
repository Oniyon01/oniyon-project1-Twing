import { useEffect, useState } from 'react';
import './IntroScreen.css';

interface Props {
  onNext: () => void;
}

const MESSAGE = '오늘은 무엇이 유행하고\n있는지 날아가볼까?';

export default function IntroScreen({ onNext }: Props) {
  const [displayed, setDisplayed] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(MESSAGE.slice(0, i));
      if (i >= MESSAGE.length) {
        clearInterval(timer);
        setTimeout(() => setShowButton(true), 300);
      }
    }, 55);
    return () => clearInterval(timer);
  }, []);

  function handleNext() {
    setLeaving(true);
    setTimeout(onNext, 500);
  }

  return (
    <div className={`intro-screen${leaving ? ' intro-leaving' : ''}`}>
      <div className="intro-wingy-wrap">
        <img src="/wingy-3d.png" alt="Wingy" className="intro-wingy" />
      </div>

      <div className="intro-bubble">
        <p className="intro-text">
          {displayed.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < displayed.split('\n').length - 1 && <br />}
            </span>
          ))}
          <span className="intro-cursor">|</span>
        </p>
      </div>

      {showButton && (
        <button className="intro-btn" onClick={handleNext}>
          날아가기 🕊️
        </button>
      )}
    </div>
  );
}
