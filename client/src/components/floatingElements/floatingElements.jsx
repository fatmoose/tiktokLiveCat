import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './floatingElements.css';

const FloatingElements = ({ likeData, giftData, onElementHit }) => {
    const [floatingHearts, setFloatingHearts] = useState([]);
    const [floatingFood, setFloatingFood] = useState([]);

    // Food items for gifts
    const foodItems = ['🍕', '🍔', '🍗', '🍎', '🍌', '🥩', '🥨', '🧀', '🥪', '🌮'];

    useEffect(() => {
        if (likeData && likeData.likeCount) {
            // Create multiple hearts for each like
            for (let i = 0; i < likeData.likeCount; i++) {
                createFloatingHeart(i * 200); // Stagger the hearts
            }
        }
    }, [likeData]);

    useEffect(() => {
        if (giftData && giftData.repeatCount) {
            // Create food items for gifts
            for (let i = 0; i < giftData.repeatCount; i++) {
                createFloatingFood(i * 300); // Stagger the food items
            }
        }
    }, [giftData]);

    const createFloatingHeart = (delay = 0) => {
        const id = Date.now() + Math.random();
        const startSide = Math.random() < 0.5 ? 'left' : 'right';
        const startY = Math.random() * 60 + 20; // 20% to 80% from top
        
        const heart = {
            id,
            startSide,
            startY,
            delay,
            type: 'heart'
        };

        setFloatingHearts(prev => [...prev, heart]);

        // Remove heart after animation
        setTimeout(() => {
            setFloatingHearts(prev => prev.filter(h => h.id !== id));
            onElementHit('heart');
        }, 3000 + delay);
    };

    const createFloatingFood = (delay = 0) => {
        const id = Date.now() + Math.random();
        const startSide = Math.random() < 0.5 ? 'left' : 'right';
        const startY = Math.random() * 60 + 20; // 20% to 80% from top
        const foodItem = foodItems[Math.floor(Math.random() * foodItems.length)];
        
        const food = {
            id,
            startSide,
            startY,
            delay,
            foodItem,
            type: 'food'
        };

        setFloatingFood(prev => [...prev, food]);

        // Remove food after animation
        setTimeout(() => {
            setFloatingFood(prev => prev.filter(f => f.id !== id));
            onElementHit('food');
        }, 4000 + delay);
    };

    return (
        <div className="floating-elements-container">
            {/* Floating Hearts */}
            {floatingHearts.map((heart) => (
                <div
                    key={heart.id}
                    className={`floating-heart ${heart.startSide}`}
                    style={{
                        top: `${heart.startY}%`,
                        animationDelay: `${heart.delay}ms`,
                    }}
                >
                    ❤️
                </div>
            ))}

            {/* Floating Food */}
            {floatingFood.map((food) => (
                <div
                    key={food.id}
                    className={`floating-food ${food.startSide}`}
                    style={{
                        top: `${food.startY}%`,
                        animationDelay: `${food.delay}ms`,
                    }}
                >
                    {food.foodItem}
                </div>
            ))}
        </div>
    );
};

FloatingElements.propTypes = {
    likeData: PropTypes.object,
    giftData: PropTypes.object,
    onElementHit: PropTypes.func.isRequired,
};

export default FloatingElements; 