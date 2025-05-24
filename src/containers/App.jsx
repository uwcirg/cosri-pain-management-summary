import FhirClientProvider from "../context/FhirClientProvider";

export default function App(props) {
  return (
    <FhirClientProvider>
      <div className="App">{props.children}</div>
    </FhirClientProvider>
  );
}
