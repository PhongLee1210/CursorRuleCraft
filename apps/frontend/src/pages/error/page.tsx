import { Button } from '@/components/Button';
import { Link, useRouteError } from 'react-router';

type RouterError = {
  statusText?: string;
  message?: string;
  status: number;
  data: string;
} & Error;

const getErrorMessage = (status: number) => {
  switch (status) {
    case 404: {
      return `The page you're looking for doesn't exist.`;
    }
    case 403: {
      return `You don't have permission to access this page.`;
    }
    case 500: {
      return `An internal server error occurred.`;
    }
    case 401: {
      return `You are not authorized to access this page.`;
    }
    case 400: {
      return `The request was invalid.`;
    }
    default: {
      return `An unexpected error occurred.`;
    }
  }
};

export const ErrorPage = () => {
  const error = useRouteError() as RouterError;
  const statusCode = error.status;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h4 className="flex flex-col text-4xl font-bold text-white">
          <span>{`Error ${statusCode}`}</span>
          {error.statusText && <span className="text-base font-normal">{error.statusText}</span>}
        </h4>

        <p className="break-words text-sm text-gray-500">
          {error.data || error.message || getErrorMessage(statusCode)}
        </p>

        <Button asChild className="inline-block pt-2">
          <Link to="/">{`Go to home`}</Link>
        </Button>
      </div>
    </main>
  );
};
