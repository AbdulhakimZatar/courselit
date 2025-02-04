import { checkIfAuthenticated } from "../../lib/graphql";
import { responses } from "../../config/strings";
import constants from "../../config/constants";
import {
    checkForInvalidPaymentSettings,
    checkForInvalidPaymentMethodSettings,
    getPaymentInvalidException,
} from "./helpers";
import type GQLContext from "../../models/GQLContext";
import DomainModel, { Domain } from "../../models/Domain";
import { checkPermission } from "@courselit/utils";
import { Typeface } from "@courselit/common-models";

const { permissions } = constants;

export const getSiteInfo = async (ctx: GQLContext) => {
    const exclusionProjection: Record<string, 0> = {
        email: 0,
        deleted: 0,
        customDomain: 0,
        "settings.stripeSecret": 0,
        "settings.paytmSecret": 0,
        "settings.paypalSecret": 0,
    };
    const siteEditor =
        ctx.user &&
        checkPermission(ctx.user.permissions, [permissions.manageSite]);
    if (!siteEditor) {
        exclusionProjection.draftTypefaces = 0;
    }
    const domain: Domain | null = await DomainModel.findById(
        ctx.subdomain._id,
        exclusionProjection
    );

    return domain;
};

/*
export const getSiteInfoAsAdmin = async (ctx: GQLContext) => {
    checkIfAuthenticated(ctx);

    if (!checkPermission(ctx.user.permissions, [permissions.manageSettings])) {
        throw new Error(responses.action_not_allowed);
    }

    const siteinfo: SiteInfo | null = await SiteInfoModel.findOne({
        domain: ctx.subdomain._id,
    });
    return siteinfo;
};
*/

export const updateSiteInfo = async (
    siteData: Record<string, unknown>,
    ctx: GQLContext
) => {
    checkIfAuthenticated(ctx);

    if (!checkPermission(ctx.user.permissions, [permissions.manageSettings])) {
        throw new Error(responses.action_not_allowed);
    }

    const domain: Domain | null = await DomainModel.findById(ctx.subdomain._id);
    if (!domain) {
        return null;
    }

    for (const key of Object.keys(siteData)) {
        domain.settings[key] = siteData[key];
    }

    if (!domain.settings.title || !domain.settings.title.trim()) {
        throw new Error(responses.school_title_not_set);
    }

    await (domain as any).save();

    return domain;
};

export const updateDraftTypefaces = async (
    typefaces: Typeface[],
    ctx: GQLContext
) => {
    checkIfAuthenticated(ctx);

    if (!checkPermission(ctx.user.permissions, [permissions.manageSettings])) {
        throw new Error(responses.action_not_allowed);
    }

    const domain: Domain | null = await DomainModel.findById(ctx.subdomain._id);
    if (!domain) {
        return null;
    }

    domain.draftTypefaces = typefaces;

    await (domain as any).save();

    return domain;
};

export const updatePaymentInfo = async (
    siteData: Record<string, unknown>,
    ctx: GQLContext
) => {
    checkIfAuthenticated(ctx);

    if (!checkPermission(ctx.user.permissions, [permissions.manageSettings])) {
        throw new Error(responses.action_not_allowed);
    }

    const domain: Domain | null = await DomainModel.findById(ctx.subdomain._id);
    if (!domain) {
        return null;
    }

    if (!domain.settings || !domain.settings.title) {
        throw new Error(responses.school_title_not_set);
    }

    for (const key of Object.keys(siteData)) {
        domain.settings[key] = siteData[key];
    }

    const invalidPaymentMethod = checkForInvalidPaymentSettings(
        domain.settings
    );
    if (invalidPaymentMethod) {
        throw invalidPaymentMethod;
    }

    const failedPaymentMethod = checkForInvalidPaymentMethodSettings(
        domain.settings
    );
    if (failedPaymentMethod) {
        throw getPaymentInvalidException(failedPaymentMethod);
    }

    if (domain.settings.paymentMethod) {
        domain.settings.currencyISOCode =
            domain.settings.currencyISOCode.toLowerCase();
    }
    await domain.save();

    return domain;
};
