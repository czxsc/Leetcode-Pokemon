// Shown instead of the app when saved data exists but can't be read, so
// nothing gets overwritten until the problem is fixed.
export function StorageError({ message }) {
  return (
    <div className="boot-error">
      <div className="panel">
        <div className="panel-title">
          <span className="dot"></span>Couldn&rsquo;t load your data
        </div>
        <p>{message}</p>
        <button className="btn green" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </div>
  )
}
