// src/components/pages/SignInPage.tsx
import React from 'react';
import SupabaseAuth from '../auth/SupabaseAuth';

const SignInPage: React.FC = () => {
  return <SupabaseAuth mode="signIn" />;
};

export default SignInPage;
