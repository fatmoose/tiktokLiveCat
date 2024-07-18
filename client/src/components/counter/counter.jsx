import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './counter.css';
import confetti from 'canvas-confetti';

const Counter = ({ data }) => {
    const [progress, setProgress] = useState(1);
    const total = 1000000;
    const increment = total * 0.000001;

    useEffect(() => {
        if (progress < total) {
            setProgress((prevProgress) => Math.min(prevProgress + increment, total));
            triggerConfetti(); 
        }
    }, [data]);

    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    return (
        <div className="container">
            <div className="progress">
                <div className="progress-bar" style={{ width: `${(progress / total) * 100}%` }}>
                </div>
            </div>
            <div className="progress-text">{Math.floor(progress)}/{total}</div>
        </div>
    );
};

Counter.propTypes = {
    data: PropTypes.any.isRequired 
};

export default Counter;

