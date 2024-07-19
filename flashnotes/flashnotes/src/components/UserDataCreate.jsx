import React from'react';


const UserDataCreate = ({userdata}) => {
  return (
    <div>
      <h1>User Data Create</h1>
      {userdata && (
        <div>
          <p>
            <strong>Nombre:</strong> {userdata.nombre}
          </p>
          <p>
            <strong>Email:</strong> {userdata.email}
          </p>
          <p>
            <strong>Password:</strong> {userdata.password}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserDataCreate;