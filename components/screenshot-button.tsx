import { Button } from "@/components/ui/button";
import { ComponentProps } from "react";

type Props = ComponentProps<'div'>& {

}

function ScreenshotButton(props: Props) {
  const { children } = props;

  return (
    <Button>
      {children}
    </Button>
  )
}

export default ScreenshotButton;
