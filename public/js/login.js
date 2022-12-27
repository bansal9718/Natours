import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  // console.log(email, password);
  try {
    //   const res = await axios({
    //     method: 'POST',
    //     url: 'http://127.0.0.1:8000/api/v1/users/login',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     data: {
    //       email,
    //       password,
    //     },
    //     withCredentials: true,

    //   });
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    };
    const { data } = await axios.post(
      'http://127.0.0.1:8000/api/v1/users/login',
      { email, password },
      config
    );

    // console.log(data.status);
    // console.log(res);
    if (data.status === 'success') {
      showAlert('success', 'Logged in successfully');

      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  };
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
      config,
    });

    if (res.data.status === 'success') {
      location.reload(false);
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try Again');
  }
};
