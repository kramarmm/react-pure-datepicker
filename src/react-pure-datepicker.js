import React from 'react';
import PropTypes from 'prop-types';
import ReactPureModal from 'react-pure-modal';
import instadate from 'instadate';
import { format as pureDateFormat } from 'react-pure-time';

class PureDatepicker extends React.Component {
  static isDateValid(possibleDate) {
    if (Object.prototype.toString.call(possibleDate) === '[object Date]') {
      if (isNaN(possibleDate.getTime())) {
        return false;
      }
      return true;
    }
    return false;
  }

  static getYearsPeriod(currentYear, years) {
    const period = [];
    let fromYear = currentYear + years[0];
    const toYear = currentYear + years[1];

    while (fromYear <= toYear) {
      period.push(fromYear);
      fromYear += 1;
    }
    return period;
  }

  static normalizeDate(date, accuracy = '', direction = '') {
    switch (`${accuracy}-${direction}`) {
      case 'month-up':
        return instadate.lastDateInMonth(date);
      case 'month-down':
        return instadate.firstDateInMonth(date);
      case 'year-up':
        return new Date(date.getFullYear(), 11, 31, 0, 0, 0, 0);
      case 'year-down':
        return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
      default:
        return date;
    }
  }

  static toDate(dateString) {
    const date = instadate.parseISOString(dateString);
    if (this.isDateValid(date)) {
      return instadate.noon(date);
    }
    return undefined;
  }

  constructor(props) {
    super(props);
    this.getDateClasses = this.getDateClasses.bind(this);
    this.getMonthClasses = this.getMonthClasses.bind(this);
    this.getYearClasses = this.getYearClasses.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.openDatepickerModal = this.openDatepickerModal.bind(this);
    this.isInRange = this.isInRange.bind(this);
    this.clear = this.clear.bind(this);
    this.getDaysNames = this.getDaysNames.bind(this);
    this.getComponentState = this.getComponentState.bind(this);
    this.state = this.getComponentState({}, this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getComponentState(this.props, nextProps));
  }

  getComponentState(props, nextProps) {
    const updatedState = {};
    const { min, max, value, today } = nextProps;

    if (props.value !== value) {
      updatedState.value = this.constructor.toDate(value);
    }
    if (props.today !== today) {
      updatedState.today = this.constructor.toDate(today);
    }
    if (props.min !== min) {
      updatedState.min = this.constructor.toDate(min);
    }
    if (props.max !== max) {
      updatedState.max = this.constructor.toDate(max);
    }

    if (Object.keys(updatedState).length > 0) {
      if (updatedState.min || updatedState.max) {
        const currentDate = updatedState.value || props.value || updatedState.today || props.today;
        if (!this.isInRange(currentDate, 'date', updatedState.min || false, updatedState.max || false)) {
          if (updatedState.min && !updatedState.max) {
            updatedState.value = updatedState.min;
          } else if (updatedState.max && !updatedState.min) {
            updatedState.value = updatedState.max;
          } else if (updatedState.min && updatedState.max) {
            if (instadate.isSameDay(updatedState.min, updatedState.max)) {
              console.warn('Incorrect min and max. There no dates to choose!');
            } else {
              updatedState.value = updatedState.min;
            }
          }
        }
      }
    }
    return updatedState;
  }

  getDaysNames() {
    if (this.props.beginFromDay < 7 && this.props.beginFromDay > -1) {
      const firstPart = this.props.weekDaysNamesShort.slice(0, this.props.beginFromDay);
      return this.props.weekDaysNamesShort
        .slice(this.props.beginFromDay)
        .concat(firstPart);
    }
    return this.props.weekDaysNamesShort;
  }

  getDateClasses(date, value, renderedDate) {
    const classes = ['date-cell'];
    if (instadate.isWeekendDate(date)) classes.push('weekend');
    if (!instadate.isSameMonth(date, renderedDate)) classes.push('out-month');

    if (value) {
      if (instadate.isSameDay(date, value)) classes.push('selected');
    } else if (instadate.isSameDay(date, renderedDate)) {
      classes.push('pre-selected');
    }

    if (!this.isInRange(date)) classes.push('out-min-max');

    return classes.join(' ');
  }

  getMonthClasses(monthName, value, renderedDate) {
    const classes = ['monthName'];
    const classForSameMonth = value ? 'selected' : 'pre-selected';
    const date = value || renderedDate;

    const dateByMonth = new Date(
      date.getFullYear(),
      this.props.monthsNames.indexOf(monthName),
      1,
      0,
      0,
      0,
      0,
    );
    if (instadate.isSameMonth(dateByMonth, date)) classes.push(classForSameMonth);
    if (!this.isInRange(dateByMonth, 'month')) classes.push('out-min-max');

    return classes.join(' ');
  }

  getYearClasses(year, value, renderedDate) {
    const classes = ['yearName'];
    const classForSameYear = value ? 'selected' : 'pre-selected';
    const date = value || renderedDate;

    const dateByYear = new Date(year, 0, 1, 0, 0, 0, 0);
    if (instadate.isSameYear(dateByYear, date)) classes.push(classForSameYear);
    if (!this.isInRange(dateByYear, 'year')) classes.push('out-min-max');

    return classes.join(' ');
  }

  isInRange(date, accuracy, min = this.state.min, max = this.state.max) {
    const normDateMin = this.constructor.normalizeDate(date, accuracy, 'up');
    const normDateMax = this.constructor.normalizeDate(date, accuracy, 'down');

    const minOk = min ? instadate.isAfter(normDateMin, instadate.addDays(min, -1)) : true;
    const maxOk = max ? instadate.isBefore(normDateMax, instadate.addDays(max, 1)) : true;

    return minOk && maxOk;
  }

  handleClick(e) {
    const { year, month, day } = e.currentTarget.dataset;
    let accuracy;

    let nextValue = new Date(this.state.value || this.state.today);
    nextValue = instadate.noon(instadate.resetTimezoneOffset(nextValue));
    if (year) {
      accuracy = 'year';
      nextValue.setFullYear(year);
    }


    if (month) {
      nextValue.setMonth(month);
      accuracy = 'month';
    }

    if (day) {
      accuracy = 'date';
      nextValue.setDate(day);
    }

    const inRange = this.isInRange(nextValue);
    const inAccuracyRange = this.isInRange(nextValue, accuracy);

    if (inRange || inAccuracyRange) {
      if (inAccuracyRange) {
        if (this.state.min && instadate.isBefore(nextValue, this.state.min)) {
          nextValue = this.state.min;
        }

        if (this.state.max && instadate.isAfter(nextValue, this.state.max)) {
          nextValue = this.state.max;
        }
      }

      if (this.props.onChange) {
        this.props.onChange(pureDateFormat(nextValue, this.props.returnFormat), this.props.name);
        if (accuracy === 'date') {
          this.closeDatepickerModal();
        }
      }
    }
  }

  clear() {
    this.props.onChange('', this.props.name);
  }

  handleInput() {

  }

  openDatepickerModal(e) {
    e.currentTarget.blur();
    if (this.props.onFocus) {
      this.props.onFocus(e);
    }
    this.refs.datepicker.open();
  }

  closeDatepickerModal() {
    this.refs.datepicker.close();
  }

  render() {
    const {
      format,
      weekDaysNamesShort,
      monthsNames,
      years,
      className,
      placeholder,
      inputClassName,
      required,
      onFocus,
      disabled,
      beginFromDay,
      ...modalAttrs
    } = this.props;

    const { value, today } = this.state;

    const renderedDate = value || today;

    const weekDaysNames = this.getDaysNames();
    const weekendsRef = weekDaysNamesShort.reduce((acc, dayName, i) => {
      acc[dayName] = i === 0 || i === 6;
      return acc;
    }, {});

    const firsDatetInPeriod = instadate.firstDateInMonth(renderedDate);
    const lastDateInPeriod = instadate.lastDateInMonth(renderedDate);
    const datesShift = !(beginFromDay < 7 && beginFromDay > -1) ? 7 : beginFromDay;
    const prevMonthDays = firsDatetInPeriod.getDay() + (7 - datesShift);
    const nextMonthDays = lastDateInPeriod.getDay() + (7 - datesShift);

    const dates = instadate.dates(
      instadate.addDays(firsDatetInPeriod, -(prevMonthDays % 7)),
      instadate.addDays(lastDateInPeriod, 6 - (nextMonthDays % 7)),
    );
    const centralYearInPeriod = renderedDate.getFullYear();
    const yearsRange = this.constructor.getYearsPeriod(centralYearInPeriod, years);

    const isTodayInRange = this.isInRange(this.state.today);

    return (
      <div className={className}>
        <input
          type="text"
          onFocus={this.openDatepickerModal}
          disabled={disabled}
          className={inputClassName}
          placeholder={placeholder}
          required={required}
          onChange={this.handleInput}
          value={value ? pureDateFormat(this.state.value, format) : ''}
        />
        <ReactPureModal
          width="500px"
          header="Select date"
          ref="datepicker"
          className="react-pure-calendar-modal"
          {...modalAttrs}
        >
          <div className="react-pure-calendar">
            <div className="calendarWrap">
              <div className="weekdays-names">
                {
                  weekDaysNames.map(weekDayName => (
                      <div
                        key={weekDayName}
                        className={`${weekendsRef[weekDayName] ? 'weekend' : ''} weekDayNameShort`}
                      >{weekDayName}</div>
                    ))
                }
              </div>
              {
                dates.map((dateObject) => {
                  const date = dateObject.getDate();
                  const month = dateObject.getMonth();
                  const year = dateObject.getFullYear();

                  return (
                    <div
                      key={`${month}-${date}`}
                      className={this.getDateClasses(
                        dateObject,
                        this.state.value,
                        renderedDate,
                      )}
                      data-day={date}
                      data-month={month}
                      data-year={year}
                      onClick={this.handleClick}
                    >{date}</div>
                  );
                })
              }
              <br />
              <br />
              <button
                onClick={this.handleClick}
                type="button"
                data-day={this.state.today.getDate()}
                data-month={this.state.today.getMonth()}
                data-year={this.state.today.getFullYear()}
                className="btn btn-block btn-sm btn-default"
                disabled={!isTodayInRange}
                title={!isTodayInRange ? 'Today date is out of range' : ''}
              >Today</button>
              <button
                onClick={this.clear}
                type="button"
                className="btn btn-block btn-sm btn-default"
              >Clear</button>
            </div>
            <div>
              {
                monthsNames.map((monthName, index) => (
                  <div
                    key={monthName}
                    data-month={index}
                    onClick={this.handleClick}
                    className={this.getMonthClasses(
                      monthName,
                      this.state.value,
                      renderedDate,
                    )}
                  >{monthName}</div>
                ))
              }
            </div>
            <div>
              <div
                data-year={yearsRange[0] + years[0]}
                onClick={this.handleClick}
                className={this.getYearClasses(
                  yearsRange[0] + years[0],
                  this.state.value,
                  renderedDate,
                )}
              >↑</div>
              {
                yearsRange.map(year => (
                  <div
                    key={year}
                    data-year={year}
                    onClick={this.handleClick}
                    className={this.getYearClasses(
                      year,
                      this.state.value,
                      renderedDate,
                    )}
                  >{year}</div>
                ))
              }
              <div
                data-year={yearsRange[yearsRange.length - 1] + years[1]}
                onClick={this.handleClick}
                className={this.getYearClasses(
                  yearsRange[yearsRange.length - 1] + years[1],
                  this.state.value,
                  renderedDate,
                )}
              >↓</div>
            </div>
          </div>
        </ReactPureModal>
      </div>
    );
  }
}

PureDatepicker.defaultProps = {
  today: instadate.noon(new Date()),
  returnFormat: 'Y-m-d H:i:s',
  format: 'd.m.Y',
  disabled: false,
  required: false,
  monthsNames: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthsNamesShort: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
  weekDaysNames: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  weekDaysNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  years: [-4, 5],
  beginFromDay: 0,
};

PureDatepicker.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
  ]),
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  today: PropTypes.instanceOf(Date),
  format: PropTypes.string.isRequired,
  returnFormat: PropTypes.string,
  weekDaysNamesShort: PropTypes.array,
  monthsNames: PropTypes.array,
  years: PropTypes.array,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  inputClassName: PropTypes.string,
  min: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
  ]),
  max: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
  ]),
  beginFromDay: PropTypes.number,
};

export default PureDatepicker;
