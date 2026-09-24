import { authActions } from '@/store/auth-slice';
import React from 'react'
import { useDispatch } from 'react-redux';

const Auth = () => {
    const dispatch = useDispatch()
    const handleSubmit = (e : any) => {
        e.preventDefault();
        dispatch(authActions.login())
    };
  return (
    <div>
      <form action="" onSubmit={handleSubmit}></form>
    </div>
  )
}

export default Auth
