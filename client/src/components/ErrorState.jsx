import { errorMessage } from '../api/axios.js';
export default function ErrorState({ error, retry }) {
  return (
    <div className="empty" role="alert">
      <p>{errorMessage(error)}</p>
      <button className="button secondary" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
