import React from 'react'
import { SessionContext } from '../Context/SessionContext'  
import '../css/home.css'


const Home = () => {
    const { user } = React.useContext(SessionContext);

    return (
        <div className='home-container'>
            <h1>Bienvenido {user}</h1>
        </div>
    )
}


export default Home;