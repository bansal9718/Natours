import axios from 'axios';
import { showAlert } from './alerts';
export const updateData = async (name, email) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:8000/api/v1/users/updateMe',
      data: {
        name,
        email,
      },
      config,
    });

    //   if (res.data.status === 'success') {
    //     showAlert('success', 'Data Updated Successfully');
    //   }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
