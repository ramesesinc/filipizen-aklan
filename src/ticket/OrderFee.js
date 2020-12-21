import React, { useState, useEffect } from "react";
import {
  Card,
  Panel,
  Subtitle,
  Spacer,
  ActionBar,
  Button,
  BackLink,
  useData,
  Label,
  currencyFormat,
  formatDate,
  Title,
  Service,
  Error,
} from "rsi-react-web-components";


const getParticulars = routes => {
  const routeTitles = routes.map(route => `${route.origin} - ${route.destination}`);
  const particulars = routeTitles.join(" and ");
  return particulars;
}

const getTravelInfo = routes => {
  const dates = routes.map(route => formatDate(route.traveldate));
  return dates.join(" and ");
}

const getGuestInfo = (entity) => {
  return `With ${entity.guests.length} Guest(s)`;
}

const txntype = 'boracayticket'
const origin = 'filipizen'

const OrderFee = ({
  partner,
  onCancel,
  onSubmit,
  error: paymentError
}) => {

  const [ctx, dispatch] = useData();
  const [bill, setBill] = useState({items:[]});
  const [error, setError] = useState(paymentError);
  const entity = ctx.entity;

  useEffect(() => {
    const svc = Service.lookup(`${partner.id}:OnlineBoracayTicketBillingService`);
    const selectedRoutes = entity.routes.filter(route => route.selected);
    svc.getBilling({routes: selectedRoutes, numguests: entity.guests.length}, (err, bill) => {
      if (err) {
        setError(err);
      } else {
        setBill(bill);
      }
    })
  }, []);


  const checkoutPayment = () => {
    const selectedRoutes = entity.routes.filter(route => route.selected);
    let particulars = "Terminal Fee for"
    particulars += " " + getParticulars(selectedRoutes);
    particulars += " " + getTravelInfo(selectedRoutes);
    particulars += ". " + getGuestInfo(entity);
    const data = {...entity, routes: entity.routes.filter(route => route.selected) };

    //TODO: refno
    onSubmit({
      refno : bill.objid || "B0001",
      txntype,
      origin,
      orgcode: partner.id,
      billtoyear: bill.billtoyear,
      billtoqtr: bill.billtoqtr,
      paidby: bill.paidby,
      paidbyaddress: bill.paidbyaddress,
      amount: bill.amount,
      paymentdetails: particulars,
      particulars: particulars,
      info: { data },
      items: bill.items,
    })
  }

  const onCancelBilling = () => {
    onCancel(4);
  }

  const selectedRoutes = entity.routes.filter(route => route.selected);
  const guestInfo = getGuestInfo(entity);

  return (
    <Card style={{maxWidth: 500}}>
      <Title>Boracay Terminal Fee Ticket Order</Title>
      <Subtitle>Order Fees</Subtitle>
      <Spacer />
      <Error msg={error} />
      <Panel style={styles.infoContainer}>
        <label style={{fontWeight: 500}}>Terminal Fee Summary</label>
        <Spacer />
        {selectedRoutes.map(route => (
          <label key={route.objid} style={styles.info}>{`${route.title} on ${formatDate(route.traveldate)}`}</label>
        ))}
        <label style={styles.info}>{guestInfo}</label>
      </Panel>
      <Spacer />
      <Panel style={styles.billContainer}>
        {bill.items.map((item, idx) => (
          <Panel style={styles.row} key={idx}>
            <Label>{item.item.title}</Label>
            <Label>{currencyFormat(item.amount)}</Label>
          </Panel>
        ))}
        <Spacer/>
        <Panel style={styles.row}>
          <Label style={{fontWeight: 800}}>TOTAL:</Label>
          <Label style={{fontWeight: 800}}>{currencyFormat(bill.amount)}</Label>
        </Panel>
      </Panel>
      <ActionBar>
        <BackLink caption="Back" action={onCancelBilling}/>
        <Button caption="Checkout" action={checkoutPayment} disableWhen={entity.guests.length === 0 }/>
      </ActionBar>
    </Card>
  )
};

const styles = {
  infoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  info: {
    fontSize: 14,
    fontWeight: 400,
  },
  billContainer: {
    display: "flex",
    flexDirection: "column",
    margin: "0px 20%",
    border: "1px solid #aaa",
    padding: 15,
    borderRadius: 5,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
};

export default OrderFee;
