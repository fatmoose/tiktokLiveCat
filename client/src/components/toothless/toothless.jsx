import toothlessGif from '../../assets/toothless.gif';
import './toothless.css';

const Toothless = () => {
    return (
        <div>
            <img src={toothlessGif} alt="Toothless" id='gif'/>
        </div>
    );
};

export default Toothless;
