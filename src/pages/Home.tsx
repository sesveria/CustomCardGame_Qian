import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="page page-home">
      <div className="home-hero">
        <div className="home-logo">🃏</div>
        <h1 className="home-title">知识卡牌对战</h1>
        <p className="home-subtitle">
          将知识点作为卡牌，发现概念之间的关联，<br />
          在游戏中巩固你的学习成果
        </p>
      </div>

      <div className="home-actions">
        <button className="btn btn-primary btn-large" onClick={() => navigate('/')}>
          🚀 进入游戏
        </button>
        <button className="btn btn-secondary btn-large" onClick={() => navigate('/editor')}>
          ✏️ 卡组编辑器
        </button>
      </div>

      <div className="home-howto">
        <h2>怎么玩</h2>
        <div className="howto-steps">
          <div className="howto-step">
            <span className="howto-num">1</span>
            <span>输入昵称登录服务器</span>
          </div>
          <div className="howto-step">
            <span className="howto-num">2</span>
            <span>在大厅邀请好友或随机匹配</span>
          </div>
          <div className="howto-step">
            <span className="howto-num">3</span>
            <span>从手牌和公共池选卡配对，发现知识关联！</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
