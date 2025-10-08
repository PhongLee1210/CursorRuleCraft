import { redirect } from 'react-router';

/**
 * Auth loader for handling OAuth callbacks
 * This loader is used for the callback route after OAuth authentication
 */
export async function authLoader() {
  // After successful OAuth authentication, Clerk handles the redirect automatically
  // This loader just ensures we redirect to the dashboard if someone lands on this route
  return redirect('/dashboard');
}
