
import { useEffect, useRef, useState } from "react"

export default function GoogleSignInButton({ onCredential }) {
  const buttonRef = useRef(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) {
      setError("Google Client ID is missing from the frontend .env file.")
      return
    }

    let cancelled = false

    function initializeGoogle() {
      if (cancelled || !window.google?.accounts?.id) return

      const buttonContainer = buttonRef.current
      if (!buttonContainer) return

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential)
          } else {
            setError("Google did not return an ID token.")
          }
        },
      })

      window.google.accounts.id.renderButton(buttonContainer, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 300,
      })
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    if (window.google?.accounts?.id) {
      initializeGoogle()
    } else if (existingScript) {
      existingScript.addEventListener("load", initializeGoogle)
    } else {
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = initializeGoogle
      script.onerror = () => {
        if (!cancelled) {
          setError("Could not load Google's sign-in library.")
        }
      }
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
      existingScript?.removeEventListener("load", initializeGoogle)
    }
  }, [onCredential])

  return (
    <div>
      <div ref={buttonRef} />

      {error && <p role="alert">{error}</p>}
    </div>
  )
}