import * as React from "react";
import Head from "next/head";

const PANDEMIC_TIME = new Date(1583949600000); // March 11 2020 18:00 UTC
const MARCH_TIME = new Date(1583060400000);// March 1 2020 12:00 UTC

export default class Home extends React.Component<{}, {showMarch: boolean}> {
  state = { showMarch: false };
  private toggleMarch = (event: React.MouseEvent) => {
    event.preventDefault();
    this.setState(({ showMarch }) => ({ showMarch: !showMarch }))
  }
  render() {
    const { showMarch } = this.state;
    return <>
      <Head>
        <title>The COVID-19 Pandemic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta property="og:title" content="The COVID-19 pandemic" />
        <meta property="og:description" content="A timer for the COVID-19 Pandemic" />
        <meta name="twitter:title" content="The COVID-19 Pandemic" />
        <meta name="twitter:description" content="A timer for the COVID-19 Pandemic" />
        <meta property="og:url" content="https://covid.guys.wtf" />
      </Head>

        <h2>Welcome To</h2>
        <h1 onClick={this.toggleMarch}>{ showMarch ? <Timer target={MARCH_TIME} dayer='date' dayString={"March"} suffix="2020">March ??? 2020</Timer> : <Timer target={PANDEMIC_TIME} dayer>Day ???</Timer> }</h1>
        <h2>The WHO declared the <a href="https://covid19.who.int/" target="_blank" rel="noopener noreferrer">COVID-19 outbreak</a> a pandemic on <em><DisplayUTCDate date={PANDEMIC_TIME} /></em> around <em><DisplayUTCTime date={PANDEMIC_TIME} /></em>.</h2>

        <h2>This declaration has lasted</h2>
        <h1><Timer target={PANDEMIC_TIME}>a very long time</Timer></h1>
        <h2>(so far)</h2>
        <h2>
            See also <a href="https://ismarchoveryet.com" target="_blank" rel="noopener noreferrer">Is March Over Yet?</a>
        </h2>
    </>;
  }
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
]

class DisplayUTCDate extends React.Component<{ date: Date }> {
  render() {
    const { date } = this.props;

    const month = MONTH_NAMES[date.getUTCMonth()];
    const [day, suffix] = fmtDom(date.getUTCMonth());
    const year = fmtDecimal(date.getUTCFullYear(), 4);

    return <>{month} {day}<sup>{suffix}</sup> {year}</>
  }
}

class DisplayUTCTime extends React.Component<{ date: Date }> {
  render() {
    const { date } = this.props;

    const hours = fmtDecimal(date.getUTCHours(), 2);
    const minutes = fmtDecimal(date.getUTCMinutes(), 2);
    
    return <>{hours}:{minutes} UTC</>
  }
}

type TimerState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} | {
  days: number;
  hours?: undefined;
  minutes?: undefined;
  seconds?: undefined;
} | {
  days?: undefined;
  hours?: undefined;
  minutes?: undefined;
  seconds?: undefined;
};

class Timer extends React.Component<{target: Date, source?: Date, dayer?: false | true | 'date', dayString?: string, suffix?: string, children?: React.ReactNode}, TimerState> {
  state: TimerState = {}

  private mounted = true;
  private updater: number | null = null;

  componentDidMount(): void {
    this.setState(this.newTimerState());
    setInterval(() => {
      if (!this.mounted) return false;
      this.setState(this.newTimerState);
    }, 500);
  }

  private readonly newTimerState = () => {
    const { dayer, source } = this.props;

    const target = new Date(this.props.target);
    const now = this.props.source ? new Date(this.props.source) : new Date();

    if (dayer === 'date') {
      const days = DayDelta(AsLocalDay(target), now);
      return { days, hours: undefined, minutes: undefined, seconds: undefined };
    } else if (dayer === true) {
      const days = DayDelta(target, now);
      return { days, hours: undefined, minutes: undefined, seconds: undefined };
    } else {
      return TimeDelta(target, now);
    }
  };

  componentWillUnmount(): void {
    this.mounted = false;

    clearInterval(this.updater);
    this.updater = null;
  }

  componentDidUpdate(prevProps: Readonly<{ target: Date; source?: Date; dayer?: false | true | 'date'; dayString?: string; suffix?: string}>, prevState: Readonly<TimerState>, snapshot?: any): void {
    // if props haven't changed, do nothing!  
    const { target, source, dayer, dayString, suffix} = this.props;
    if (dateToInt(target) === dateToInt(prevProps.target) && dateToInt(source) === dateToInt(prevProps.source) && dayer === prevProps.dayer && dayString === prevProps.dayString && suffix === prevProps.suffix) {
      return
    }

    // trigger an update immediatly!
    this.setState(this.newTimerState());
  }

  render() {
    const { dayer, suffix } = this.props;
    
    const {days, minutes, hours, seconds} = this.state;
    if (days === undefined && this.props.children) { // undefined state!
      return this.props.children;
    }

    const suffixE = (typeof suffix === 'string') ? <>{` `}{suffix}</> : null;
  
    if ( minutes === undefined) { // dayer mode
      if ( dayer === 'date' ) {
        const [no, suffix] = fmtDom(days);
        return <>
          <span>
            {this.props.dayString ?? "Day"} {` `}
          </span>
          <span>
            {no}<sup>{suffix}</sup>
          </span>
          {suffixE}
        </>
      } else {
        return <>
          <span>
            {this.props.dayString ?? "Day"} {` `}
          </span>
          <span>
            {fmtDecimal(days, 3)}
          </span>
          {suffixE}
        </>
      }
    }
  
  
    return <>
      <span>{fmtDecimal(days, 3)}</span>d {` `}
      <span>{fmtDecimal(hours, 2)}</span>h {` `}
      <span>{fmtDecimal(minutes, 2)}</span>m {` `}
      <span>{fmtDecimal(seconds, 2)}</span>s
      {suffixE}
    </>
  }
}

function fmtDecimal(n: number | undefined, digits: number): string {
  if (typeof n !== 'number') {
    let s = '';
    while(s.length < digits) {
      s += '?';
    }
    return s;
  }

  let s = n.toString();
  while(s.length < digits) {
    s = '0' + s; 
  }
  return s;
}

function fmtDom(n: number): [string, string] {
  // adapted from https://stackoverflow.com/a/13627586
  let suffix = 'th';
  const nd = n % 10;
  const nh = n % 100;
  if (nd === 1 && nh !== 11) {
    suffix = 'st'
  } else if (nd === 2 && nh !== 12) {
    suffix = 'nd';
  } else if (nd == 3 && nh !== 13) {
    suffix = 'rd';
  }
  return [n.toString(), suffix]
}

function AsLocalDay(a: Date) : Date {
  const d = new Date();
  d.setFullYear(a.getUTCFullYear())
  d.setMonth(a.getUTCMonth())
  d.setDate(a.getUTCDate());
  d.setHours(0, 0, 0, 0);
  return d
}

function DayDelta(a: Date, b: Date) {
  const distance = Math.abs(a.getTime() - b.getTime());
  return Math.ceil(distance / (1000 * 60 * 60 * 24));
}

function TimeDelta(a: Date, b: Date) {
  const distance = Math.abs(a.getTime() - b.getTime());

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return {days, hours, minutes, seconds};
}

function dateToInt(d: Date | undefined): number | undefined {
  if (d === undefined) return undefined;
  return d.valueOf()
}