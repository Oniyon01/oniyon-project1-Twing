import { useEffect, useState } from 'react';
import './IntroScreen.css';

interface Props {
  onNext: () => void;
}

const MESSAGE = '유행을 따라가지 말고,\n직접 만들어봐';

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
      <div className="intro-wingle-wrap">
        <img src="/wingle-3d.png" alt="윙글이" className="intro-wingle" />
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
          시작하기 →
        </button>
      )}
    </div>
  );
}
