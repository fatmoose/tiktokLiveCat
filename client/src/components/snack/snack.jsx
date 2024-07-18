import snack from '../../assets/pizza.png';
import './snack.css';

const Snack = () => {
    return (
        <div>
            <img src={snack} alt="Snack for Toothless" id='snack'/>
        </div>
    );
};

export default Snack;