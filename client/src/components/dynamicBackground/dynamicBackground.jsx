import PropTypes from 'prop-types';
import './dynamicBackground.css';

const DynamicBackground = ({ activityLevel = 0 }) => {
    const getActivityClass = () => {
        if (activityLevel > 300) return 'legendary-activity';
        if (activityLevel > 150) return 'high-activity';
        if (activityLevel > 75) return 'medium-activity';
        if (activityLevel > 25) return 'low-activity';
        return 'calm';
    };

    return (
        <div className={`dynamic-background ${getActivityClass()}`}>
            {/* Gradient base layer */}
            <div className="gradient-layer" />
            
            {/* Floating particles */}
            <div className="particles-layer">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="particle" />
                ))}
            </div>
            
            {/* Wave effects */}
            <div className="waves-layer" />
            
            {/* Disco lights */}
            <div className="disco-layer">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="disco-light" />
                ))}
            </div>
        </div>
    );
};

DynamicBackground.propTypes = {
    activityLevel: PropTypes.number,
};

export default DynamicBackground; 