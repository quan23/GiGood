import { Redirect } from "expo-router";

const href: any = "/(app)/(tabs)";

export default function AppIndex() {
  return <Redirect href={href} />;
}
